import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { supabase } from "./lib/supabase";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import WorkoutDetail from "./pages/WorkoutDetail";
import ActiveSession from "./pages/ActiveSession";
import History from "./pages/History";
import CreateWorkout from "./pages/CreateWorkout";
import QuickLog from "./pages/QuickLog";
import Nav from "./components/Nav";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const rowToEntry = (row) => ({
  id:           row.id,
  date:         row.date,
  title:        row.title,
  duration:     row.duration,
  stars:        row.stars,
  calories:     row.calories,
  distance:     row.distance,
  distanceUnit: row.distance_unit,
  heartRate:    row.heart_rate,
});

export default function App() {
  const [profiles, setProfiles]             = useLocalStorage("gym_profiles", []);
  const [activeId, setActiveId]             = useLocalStorage("gym_active_id", null);
  const [allHistory, setAllHistory]         = useLocalStorage("gym_all_history", {});
  const [customWorkouts, setCustomWorkouts] = useLocalStorage("gym_custom_workouts", []);
  const [customExercises, setCustomExercises] = useLocalStorage("gym_custom_exercises", []);
  const [theme, setTheme]                   = useLocalStorage("gym_theme", "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const [addingProfile, setAddingProfile] = useState(false);

  const profile = profiles.find((p) => p.id === activeId) || null;
  const history = allHistory[activeId] || [];

  const handleOnboardingComplete = async ({ name, level, equipment, squadCode }) => {
    const newProfile = { id: Date.now().toString(), name, level, equipment };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveId(newProfile.id);
    setAddingProfile(false);

    if (squadCode && supabase) {
      try {
        const upper = squadCode.toUpperCase().trim();
        const { data: squadData } = await supabase.from("squads").select("id").eq("id", upper).single();
        if (squadData) {
          const { data: members } = await supabase.from("squad_members").select("name, profile_id").eq("squad_id", upper);
          const conflict = members?.find((m) => m.name.toLowerCase() === name.toLowerCase() && m.profile_id !== newProfile.id);
          if (!conflict) {
            await supabase.from("squad_members").upsert({ profile_id: newProfile.id, squad_id: upper, name });
            setProfiles((prev) => prev.map((p) => p.id === newProfile.id ? { ...p, squadId: upper } : p));
          }
        }
      } catch (_) {
        // silently fail — user can join from the squad section on Home
      }
    }
  };

  // ─── Squad leaderboard ────────────────────────────────────────────────────
  const [squadLeaderboard, setSquadLeaderboard] = useState([]);
  const fetchLeaderboardRef = useRef(null);

  useEffect(() => {
    if (!supabase || !profile?.squadId) { setSquadLeaderboard([]); return; }
    let cancelled = false;

    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("workout_history")
        .select("profile_name, stars")
        .eq("squad_id", profile.squadId);
      if (cancelled || !data) return;
      const agg = {};
      data.forEach(({ profile_name, stars }) => {
        const key = profile_name.toLowerCase();
        if (!agg[key]) agg[key] = { name: profile_name, stars: 0, sessions: 0 };
        agg[key].stars += stars || 1;
        agg[key].sessions++;
      });
      setSquadLeaderboard(Object.values(agg).sort((a, b) => b.stars - a.stars));
    };

    // Backfill any local sessions that weren't synced when this profile joined the squad.
    const backfill = async () => {
      const local = allHistory[activeId] || [];
      if (local.length === 0) return;
      const rows = local.map((e) => ({
        id:            e.id,
        squad_id:      profile.squadId,
        profile_name:  profile.name,
        date:          e.date,
        title:         e.title,
        duration:      e.duration || 0,
        stars:         e.stars || 1,
        calories:      e.calories      || null,
        distance:      e.distance      || null,
        distance_unit: e.distanceUnit  || null,
        heart_rate:    e.heartRate     || null,
      }));
      await supabase.from("workout_history").upsert(rows, { onConflict: "id" });
    };

    fetchLeaderboardRef.current = fetchLeaderboard;

    const init = async () => { await backfill(); await fetchLeaderboard(); };
    init();

    // Re-fetch when user returns to the tab (mobile backgrounding drops real-time)
    const onVisible = () => { if (!document.hidden) fetchLeaderboard(); };
    document.addEventListener("visibilitychange", onVisible);

    const channel = supabase
      .channel(`squad:${profile.squadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "workout_history", filter: `squad_id=eq.${profile.squadId}` }, fetchLeaderboard)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "squad_members",   filter: `squad_id=eq.${profile.squadId}` }, fetchLeaderboard)
      .subscribe();

    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); supabase.removeChannel(channel); };
  }, [profile?.squadId]);

  // ─── History sync ─────────────────────────────────────────────────────────
  const activeIdRef = useRef(activeId);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  useEffect(() => {
    if (!supabase || !profile?.squadId || !profile?.name) return;
    let cancelled = false;

    const mergeRemote = (rows) => {
      setAllHistory((h) => {
        const id = activeIdRef.current;
        const local = h[id] || [];
        const localIds = new Set(local.map((e) => e.id).filter(Boolean));
        const incoming = rows
          .filter((row) => !localIds.has(row.id))
          .map(rowToEntry);
        if (incoming.length === 0) return h;
        const merged = [...incoming, ...local].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        return { ...h, [id]: merged };
      });
    };

    const fetchHistory = async () => {
      const { data } = await supabase
        .from("workout_history")
        .select("*")
        .eq("squad_id", profile.squadId)
        .eq("profile_name", profile.name)
        .order("date", { ascending: false });
      if (cancelled || !data) return;
      mergeRemote(data);
    };

    fetchHistory();

    const channel = supabase
      .channel(`history:${profile.squadId}:${profile.name}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workout_history", filter: `squad_id=eq.${profile.squadId}` },
        (payload) => {
          if (payload.new.profile_name.toLowerCase() !== profile.name.toLowerCase()) return;
          mergeRemote([payload.new]);
        }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [profile?.squadId, profile?.name]);

  // ─── Squad join / create / leave ──────────────────────────────────────────
  const createSquad = async () => {
    if (!supabase || !profile) throw new Error("Supabase not configured");
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("squads").insert({ id: code });
    if (error) throw error;
    await supabase.from("squad_members").upsert({ profile_id: profile.id, squad_id: code, name: profile.name });
    setProfiles((prev) => prev.map((p) => p.id === activeId ? { ...p, squadId: code } : p));
    return code;
  };

  const joinSquad = async (code) => {
    if (!supabase || !profile) throw new Error("Supabase not configured");
    const upper = code.toUpperCase().trim();
    const { data, error } = await supabase.from("squads").select("id").eq("id", upper).single();
    if (error || !data) throw new Error("Squad not found — check the code and try again.");
    const { data: members } = await supabase
      .from("squad_members")
      .select("name, profile_id")
      .eq("squad_id", upper);
    const conflict = members?.find(
      (m) => m.name.toLowerCase() === profile.name.toLowerCase() && m.profile_id !== activeId
    );
    if (conflict) throw new Error(`"${profile.name}" is already taken in this squad. Change your name in Settings first.`);
    await supabase.from("squad_members").upsert({ profile_id: activeId, squad_id: upper, name: profile.name });
    setProfiles((prev) => prev.map((p) => p.id === activeId ? { ...p, squadId: upper } : p));
  };

  const leaveSquad = () => {
    setProfiles((prev) => prev.map((p) => p.id === activeId ? { ...p, squadId: null } : p));
    setSquadLeaderboard([]);
  };

  // ─── Log workout ──────────────────────────────────────────────────────────
  const addToHistory = (log) => {
    const stars = (log.duration || 0) >= 60 ? 3 : (log.duration || 0) >= 45 ? 2 : 1;
    const entry = { ...log, stars, id: log.id || uid() };
    setAllHistory((h) => ({ ...h, [activeId]: [entry, ...(h[activeId] || [])] }));
    if (supabase && profile?.squadId) {
      supabase.from("squad_sessions").insert({
        squad_id:     profile.squadId,
        profile_id:   activeId,
        profile_name: profile.name,
        title:        log.title,
        date:         log.date,
        duration:     log.duration || 0,
        stars,
      });
      supabase.from("workout_history").upsert({
        id:           entry.id,
        squad_id:     profile.squadId,
        profile_name: profile.name,
        date:         entry.date,
        title:        entry.title,
        duration:     entry.duration || 0,
        stars,
        calories:     entry.calories     || null,
        distance:     entry.distance     || null,
        distance_unit: entry.distanceUnit || null,
        heart_rate:   entry.heartRate    || null,
      }, { onConflict: "id" }).then(() => fetchLeaderboardRef.current?.());
    }
  };

  // ─── Leaderboard (local profiles) ────────────────────────────────────────
  const leaderboard = profiles
    .map((p) => ({
      ...p,
      sessions: (allHistory[p.id] || []).length,
      stars: (allHistory[p.id] || []).reduce((sum, l) => sum + (l.stars || 1), 0),
    }))
    .sort((a, b) => b.stars - a.stars);

  const toggleDislikedExercise = (exerciseId) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeId) return p;
        const disliked = p.dislikedExercises || [];
        return {
          ...p,
          dislikedExercises: disliked.includes(exerciseId)
            ? disliked.filter((id) => id !== exerciseId)
            : [...disliked, exerciseId],
        };
      })
    );
  };

  const deleteProfile = (id) => {
    const remaining = profiles.filter((p) => p.id !== id);
    setProfiles(remaining);
    setAllHistory((h) => { const next = { ...h }; delete next[id]; return next; });
    if (id === activeId) setActiveId(remaining.length > 0 ? remaining[0].id : null);
  };

  const deleteHistoryEntry = (index) => {
    const entry = (allHistory[activeId] || [])[index];
    setAllHistory((h) => ({ ...h, [activeId]: (h[activeId] || []).filter((_, i) => i !== index) }));
    if (supabase && entry?.id && profile?.squadId) {
      supabase.from("workout_history").delete().eq("id", entry.id)
        .then(() => fetchLeaderboardRef.current?.());
    }
  };

  const saveCustomWorkout   = (w) => setCustomWorkouts((prev) => [w, ...prev]);
  const deleteCustomWorkout = (id) => setCustomWorkouts((prev) => prev.filter((w) => w.id !== id));
  const saveCustomExercise  = (e) => setCustomExercises((prev) => [e, ...prev]);

  const [workoutOverrides, setWorkoutOverrides] = useLocalStorage("gym_workout_overrides", {});

  const saveWorkoutEdit = (workout) => {
    if (workout.isCustom) {
      setCustomWorkouts((prev) => prev.map((w) => w.id === workout.id ? workout : w));
    } else {
      setWorkoutOverrides((prev) => ({ ...prev, [workout.id]: workout }));
    }
  };

  const resetWorkoutOverride = (id) => {
    setWorkoutOverrides((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  if (profiles.length === 0 || addingProfile) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        onCancel={addingProfile ? () => setAddingProfile(false) : null}
      />
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-950 pb-20 md:pb-0 md:pl-20">
        <Routes>
          <Route path="/" element={
            <Home
              profile={profile} profiles={profiles} activeId={activeId}
              history={history} leaderboard={leaderboard}
              onSwitch={setActiveId} onAddProfile={() => setAddingProfile(true)}
              onDeleteProfile={deleteProfile}
              squadLeaderboard={squadLeaderboard}
              supabaseEnabled={!!supabase}
              onCreateSquad={createSquad}
              onJoinSquad={joinSquad}
              onLeaveSquad={leaveSquad}
            />
          } />
          <Route path="/browse" element={
            <Browse profile={profile} customWorkouts={customWorkouts} onDeleteCustom={deleteCustomWorkout} />
          } />
          <Route path="/workout/:id" element={
            <WorkoutDetail
              profile={profile}
              customWorkouts={customWorkouts}
              customExercises={customExercises}
              workoutOverrides={workoutOverrides}
              onToggleDislike={toggleDislikedExercise}
              onSaveWorkoutEdit={saveWorkoutEdit}
              onResetWorkoutEdit={resetWorkoutOverride}
            />
          } />
          <Route path="/session/:id" element={
            <ActiveSession customWorkouts={customWorkouts} customExercises={customExercises} profile={profile} onComplete={addToHistory} onToggleDislike={toggleDislikedExercise} />
          } />
          <Route path="/history" element={<History history={history} profile={profile} allHistory={allHistory} profiles={profiles} onDeleteEntry={deleteHistoryEntry} onToggleDislike={toggleDislikedExercise} />} />
          <Route path="/create" element={
            <CreateWorkout
              onSaveWorkout={saveCustomWorkout}
              onSaveExercise={saveCustomExercise}
              customExercises={customExercises}
            />
          } />
          <Route path="/log" element={
            <QuickLog customWorkouts={customWorkouts} onComplete={addToHistory} />
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Nav theme={theme} onToggleTheme={toggleTheme} />
      </div>
    </BrowserRouter>
  );
}
