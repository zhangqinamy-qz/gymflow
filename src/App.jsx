import { useState, useEffect } from "react";
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
import Nav from "./components/Nav";

export default function App() {
  const [profiles, setProfiles]           = useLocalStorage("gym_profiles", []);
  const [activeId, setActiveId]           = useLocalStorage("gym_active_id", null);
  const [allHistory, setAllHistory]       = useLocalStorage("gym_all_history", {});
  const [customWorkouts, setCustomWorkouts] = useLocalStorage("gym_custom_workouts", []);
  const [customExercises, setCustomExercises] = useLocalStorage("gym_custom_exercises", []);
  const [theme, setTheme] = useLocalStorage("gym_theme", "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const [addingProfile, setAddingProfile] = useState(false);

  const profile = profiles.find((p) => p.id === activeId) || null;
  const history = allHistory[activeId] || [];

  const handleOnboardingComplete = ({ name, level, equipment }) => {
    const newProfile = { id: Date.now().toString(), name, level, equipment };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveId(newProfile.id);
    setAddingProfile(false);
  };

  // ─── Squad ────────────────────────────────────────────────────────────────
  const [squadLeaderboard, setSquadLeaderboard] = useState([]);

  useEffect(() => {
    if (!supabase || !profile?.squadId) { setSquadLeaderboard([]); return; }
    let cancelled = false;

    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("squad_sessions")
        .select("profile_id, profile_name, stars")
        .eq("squad_id", profile.squadId);
      if (cancelled || !data) return;
      const agg = {};
      data.forEach(({ profile_id, profile_name, stars }) => {
        if (!agg[profile_id]) agg[profile_id] = { id: profile_id, name: profile_name, stars: 0, sessions: 0 };
        agg[profile_id].stars += stars || 1;
        agg[profile_id].sessions++;
      });
      setSquadLeaderboard(Object.values(agg).sort((a, b) => b.stars - a.stars));
    };

    fetchLeaderboard();

    const channel = supabase
      .channel(`squad:${profile.squadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "squad_sessions", filter: `squad_id=eq.${profile.squadId}` }, fetchLeaderboard)
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [profile?.squadId]);

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
    await supabase.from("squad_members").upsert({ profile_id: profile.id, squad_id: upper, name: profile.name });
    setProfiles((prev) => prev.map((p) => p.id === activeId ? { ...p, squadId: upper } : p));
  };

  const leaveSquad = () => {
    setProfiles((prev) => prev.map((p) => p.id === activeId ? { ...p, squadId: null } : p));
    setSquadLeaderboard([]);
  };
  // ──────────────────────────────────────────────────────────────────────────

  const addToHistory = (log) => {
    const stars = (log.duration || 0) >= 60 ? 3 : 1;
    setAllHistory((h) => ({ ...h, [activeId]: [{ ...log, stars }, ...(h[activeId] || [])] }));
    if (supabase && profile?.squadId) {
      supabase.from("squad_sessions").insert({
        squad_id: profile.squadId,
        profile_id: activeId,
        profile_name: profile.name,
        title: log.title,
        date: log.date,
        duration: log.duration || 0,
        stars,
      });
    }
  };

  // Leaderboard: all profiles ranked by total stars
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

  const deleteHistoryEntry = (index) =>
    setAllHistory((h) => ({ ...h, [activeId]: (h[activeId] || []).filter((_, i) => i !== index) }));

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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Nav theme={theme} onToggleTheme={toggleTheme} />
      </div>
    </BrowserRouter>
  );
}
