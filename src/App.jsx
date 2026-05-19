import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { supabase } from "./lib/supabase";
import { computeWeeklyScore, getSessionCategories } from "./lib/diversityUtils";
import { workouts as presetWorkouts } from "./data/workouts";
import { exercises } from "./data/exercises";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import WorkoutDetail from "./pages/WorkoutDetail";
import ActiveSession from "./pages/ActiveSession";
import History from "./pages/History";
import CreateWorkout from "./pages/CreateWorkout";
import QuickLog from "./pages/QuickLog";
import SquadMemberHistory from "./pages/SquadMemberHistory";
import Nav from "./components/Nav";

const exercisesById = Object.fromEntries(exercises.map((e) => [e.id, e]));

function buildCategoryMap(allWorkouts) {
  const map = {};
  for (const w of allWorkouts) {
    const cats = getSessionCategories(w, exercisesById);
    if (cats.length > 0) map[w.title.toLowerCase()] = cats;
  }
  return map;
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};

const fireNotification = (body) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('GYMBUDDY', { body });
};

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
  categories:   row.categories ? row.categories.split(',').filter(Boolean) : [],
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

  // Backfill categories for local sessions that were logged before diversity scoring was added
  useEffect(() => {
    const catMap = buildCategoryMap([...presetWorkouts, ...customWorkouts]);
    setAllHistory((prev) => {
      let changed = false;
      const next = {};
      for (const [pid, sessions] of Object.entries(prev)) {
        next[pid] = sessions.map((s) => {
          if (s.categories && s.categories.length > 0) return s;
          const cats = catMap[s.title?.toLowerCase()] || [];
          if (cats.length === 0) return s;
          changed = true;
          return { ...s, categories: cats };
        });
      }
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customWorkouts.length]);

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
  const [squadLeaderboard,  setSquadLeaderboard]  = useState([]);
  const [squadHistory,      setSquadHistory]      = useState({});
  const [squadChallenges,   setSquadChallenges]   = useState([]);
  const fetchLeaderboardRef   = useRef(null);
  const fetchChallengesRef    = useRef(null);
  const squadLeaderboardRef   = useRef([]);
  const seenChallengeIds      = useRef(null); // null = not seeded yet
  const seenCompletedIds      = useRef(null);
  useEffect(() => { squadLeaderboardRef.current = squadLeaderboard; }, [squadLeaderboard]);

  useEffect(() => {
    if (!supabase || !profile?.squadId) { setSquadLeaderboard([]); setSquadChallenges([]); seenChallengeIds.current = null; seenCompletedIds.current = null; return; }
    requestNotificationPermission();
    let cancelled = false;

    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("workout_history")
        .select("profile_name, stars, date, title, duration, calories, distance, distance_unit, heart_rate, categories")
        .eq("squad_id", profile.squadId)
        .order("date", { ascending: false });
      if (cancelled || !data) return;
      const agg = {};
      const hist = {};
      data.forEach(({ profile_name, stars, date, title, duration, calories, distance, distance_unit, heart_rate, categories }) => {
        const key = profile_name.toLowerCase();
        if (!agg[key]) agg[key] = { name: profile_name, sessions: 0 };
        agg[key].sessions++;
        if (!hist[profile_name]) hist[profile_name] = [];
        hist[profile_name].push({
          date, stars: stars || 1, title, duration,
          calories, distance, distanceUnit: distance_unit, heartRate: heart_rate,
          categories: categories ? categories.split(',').filter(Boolean) : [],
        });
      });
      Object.entries(agg).forEach(([key, entry]) => {
        const histKey = Object.keys(hist).find((k) => k.toLowerCase() === key);
        const { score, weekStars, hitCategories } = computeWeeklyScore(histKey ? hist[histKey] : []);
        entry.weeklyScore = score;
        entry.weekStars = weekStars;
        entry.hitCategories = hitCategories;
      });
      const newBoard = Object.values(agg).sort((a, b) => b.weeklyScore - a.weeklyScore);

      if (squadLeaderboardRef.current.length > 0) {
        const myName = profile.name.toLowerCase();
        const oldRank = squadLeaderboardRef.current.findIndex((m) => m.name.toLowerCase() === myName);
        const newRank = newBoard.findIndex((m) => m.name.toLowerCase() === myName);
        if (oldRank !== -1 && newRank !== -1 && newRank > oldRank) {
          const passer = newBoard[newRank - 1];
          fireNotification(`${passer?.name || "Someone"} just passed you on the leaderboard! 💪`);
        }
      }

      setSquadLeaderboard(newBoard);
      setSquadHistory(hist);
    };

    // Backfill categories on remote rows that predate diversity scoring
    const backfillCategories = async () => {
      const catMap = buildCategoryMap([...presetWorkouts, ...customWorkouts]);
      const { data } = await supabase
        .from("workout_history")
        .select("id, title")
        .eq("squad_id", profile.squadId)
        .is("categories", null);
      if (!data || data.length === 0) return;
      const toUpdate = data.filter((row) => catMap[row.title?.toLowerCase()]);
      for (const row of toUpdate) {
        await supabase
          .from("workout_history")
          .update({ categories: catMap[row.title.toLowerCase()].join(',') })
          .eq("id", row.id);
      }
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
        categories:    e.categories?.join(',') || null,
      }));
      await supabase.from("workout_history").upsert(rows, { onConflict: "id" });
    };

    const fetchChallenges = async () => {
      const { data } = await supabase
        .from("squad_challenges")
        .select("*")
        .eq("squad_id", profile.squadId)
        .order("created_at", { ascending: false });
      if (cancelled || !data) return;

      const myName = profile.name.toLowerCase();
      const pending   = data.filter((c) => c.to_name?.toLowerCase()   === myName && !c.completed);
      const completed = data.filter((c) => c.from_name?.toLowerCase() === myName &&  c.completed);

      if (seenChallengeIds.current === null) {
        // First load — seed without notifying
        seenChallengeIds.current  = new Set(pending.map((c) => c.id));
        seenCompletedIds.current  = new Set(completed.map((c) => c.id));
      } else {
        pending.forEach((c) => {
          if (!seenChallengeIds.current.has(c.id)) {
            fireNotification(`${c.from_name} challenged you: ${c.workout_title} ⚡`);
            seenChallengeIds.current.add(c.id);
          }
        });
        completed.forEach((c) => {
          if (!seenCompletedIds.current.has(c.id)) {
            fireNotification(`${c.to_name} completed your challenge: ${c.workout_title}! 🎉`);
            seenCompletedIds.current.add(c.id);
          }
        });
      }

      setSquadChallenges(data);
    };

    fetchLeaderboardRef.current  = fetchLeaderboard;
    fetchChallengesRef.current   = fetchChallenges;

    const init = async () => { await backfill(); await backfillCategories(); await fetchLeaderboard(); await fetchChallenges(); };
    init();

    // Re-fetch when user returns to the tab (mobile backgrounding drops real-time)
    const onVisible = () => { if (!document.hidden) fetchLeaderboard(); };
    document.addEventListener("visibilitychange", onVisible);

    const channel = supabase
      .channel(`squad:${profile.squadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "workout_history", filter: `squad_id=eq.${profile.squadId}` }, fetchLeaderboard)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "squad_members",   filter: `squad_id=eq.${profile.squadId}` }, fetchLeaderboard)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "squad_challenges", filter: `squad_id=eq.${profile.squadId}` }, () => fetchChallengesRef.current?.())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "squad_challenges", filter: `squad_id=eq.${profile.squadId}` }, () => fetchChallengesRef.current?.())
      .subscribe();

    const pollInterval = setInterval(() => {
      if (document.hidden) return;
      fetchLeaderboardRef.current?.();
      fetchChallengesRef.current?.();
    }, 600000);

    return () => { cancelled = true; clearInterval(pollInterval); document.removeEventListener("visibilitychange", onVisible); supabase.removeChannel(channel); };
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

  // ─── Squad custom workouts sync ───────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !profile?.squadId) return;
    let cancelled = false;

    const mergeRemote = (rows) => {
      setCustomWorkouts((prev) => {
        const localIds = new Set(prev.map((w) => w.id));
        const incoming = rows.map((r) => r.workout).filter((w) => !localIds.has(w.id));
        return incoming.length === 0 ? prev : [...prev, ...incoming];
      });
    };

    const removeRemote = (id) => {
      setCustomWorkouts((prev) => prev.filter((w) => w.id !== id || w.createdBy === profile?.name));
    };

    supabase
      .from("custom_workouts")
      .select("*")
      .eq("squad_id", profile.squadId)
      .then(({ data }) => { if (!cancelled && data) mergeRemote(data); });

    const channel = supabase
      .channel(`custom_workouts:${profile.squadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "custom_workouts", filter: `squad_id=eq.${profile.squadId}` },
        (payload) => mergeRemote([payload.new]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "custom_workouts", filter: `squad_id=eq.${profile.squadId}` },
        (payload) => removeRemote(payload.old.id))
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [profile?.squadId]);

  // ─── Squad custom exercises sync ──────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !profile?.squadId) return;
    let cancelled = false;

    const mergeRemote = (rows) => {
      setCustomExercises((prev) => {
        const localIds = new Set(prev.map((e) => e.id));
        const incoming = rows.map((r) => r.exercise).filter((e) => e && !localIds.has(e.id));
        return incoming.length === 0 ? prev : [...incoming, ...prev];
      });
    };

    const removeRemote = (id) => {
      setCustomExercises((prev) => prev.filter((e) => e.id !== id || e.createdBy === profile?.name));
    };

    supabase
      .from("custom_exercises")
      .select("*")
      .eq("squad_id", profile.squadId)
      .then(({ data }) => { if (!cancelled && data) mergeRemote(data); });

    const channel = supabase
      .channel(`custom_exercises:${profile.squadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "custom_exercises", filter: `squad_id=eq.${profile.squadId}` },
        (payload) => mergeRemote([payload.new]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "custom_exercises", filter: `squad_id=eq.${profile.squadId}` },
        (payload) => removeRemote(payload.old.id))
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [profile?.squadId]);

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
    setSquadHistory({});
    setSquadChallenges([]);
  };

  const sendChallenge = async (toName, workoutTitle, workoutId, message) => {
    if (!supabase || !profile?.squadId) return;
    await supabase.from("squad_challenges").insert({
      id:            uid(),
      squad_id:      profile.squadId,
      from_name:     profile.name,
      to_name:       toName,
      workout_title: workoutTitle,
      workout_id:    workoutId || null,
      message:       message   || null,
    });
  };

  const completeChallenge = async (challengeId) => {
    if (!supabase) return;
    const now = new Date().toISOString();
    await supabase.from("squad_challenges")
      .update({ completed: true, completed_at: now })
      .eq("id", challengeId);
    setSquadChallenges((prev) =>
      prev.map((c) => c.id === challengeId ? { ...c, completed: true, completed_at: now } : c)
    );
  };

  // ─── Log workout ──────────────────────────────────────────────────────────
  const addToHistory = (log) => {
    const stars = (log.duration || 0) >= 60 ? 3 : (log.duration || 0) >= 45 ? 2 : 1;
    const entry = { ...log, stars, id: log.id || uid(), categories: log.categories || [] };

    // Auto-complete any pending challenge that matches this workout title
    if (profile?.squadId) {
      squadChallenges
        .filter((c) =>
          c.to_name.toLowerCase() === profile.name.toLowerCase() &&
          !c.completed &&
          c.workout_title.toLowerCase() === (log.title || "").toLowerCase()
        )
        .forEach((c) => completeChallenge(c.id));
    }
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
        categories:   entry.categories?.join(',') || null,
      }, { onConflict: "id" }).then(() => fetchLeaderboardRef.current?.());
    }
  };

  // ─── Leaderboard (local profiles) ────────────────────────────────────────
  const leaderboard = profiles
    .map((p) => {
      const sessions = allHistory[p.id] || [];
      const { score, weekStars, hitCategories } = computeWeeklyScore(sessions);
      return {
        ...p,
        sessions: sessions.length,
        stars: sessions.reduce((sum, l) => sum + (l.stars || 1), 0),
        weeklyScore: score,
        weekStars,
        hitCategories,
      };
    })
    .sort((a, b) => b.weeklyScore - a.weeklyScore);

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

  const updateProfile = (id, updates) => {
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProfile = (id) => {
    const deleted = profiles.find((p) => p.id === id);
    const remaining = profiles.filter((p) => p.id !== id);
    setProfiles(remaining);
    setAllHistory((h) => { const next = { ...h }; delete next[id]; return next; });
    if (id === activeId) setActiveId(remaining.length > 0 ? remaining[0].id : null);
    if (supabase && deleted?.squadId && deleted?.name) {
      supabase.from("workout_history").delete().eq("squad_id", deleted.squadId).eq("profile_name", deleted.name);
      supabase.from("squad_sessions").delete().eq("squad_id", deleted.squadId).eq("profile_name", deleted.name);
    }
  };

  const deleteHistoryEntry = (index) => {
    const entry = (allHistory[activeId] || [])[index];
    setAllHistory((h) => ({ ...h, [activeId]: (h[activeId] || []).filter((_, i) => i !== index) }));
    if (supabase && entry?.id && profile?.squadId) {
      supabase.from("workout_history").delete().eq("id", entry.id)
        .then(() => fetchLeaderboardRef.current?.());
    }
  };

  const saveCustomWorkout = (w) => {
    const workout = { ...w, createdBy: profile?.name || null };
    setCustomWorkouts((prev) => prev.some((p) => p.id === workout.id) ? prev : [workout, ...prev]);
    if (supabase && profile?.squadId) {
      supabase.from("custom_workouts").upsert({
        id: workout.id,
        squad_id: profile.squadId,
        created_by: profile.name,
        workout,
      });
    }
  };
  const deleteCustomWorkout = (id) => {
    setCustomWorkouts((prev) => prev.filter((w) => w.id !== id));
    if (supabase && profile?.squadId) {
      supabase.from("custom_workouts").delete().eq("id", id);
    }
  };
  const saveCustomExercise = (e) => {
    const exercise = { ...e, createdBy: profile?.name || null };
    setCustomExercises((prev) => prev.some((p) => p.id === exercise.id) ? prev : [exercise, ...prev]);
    if (supabase && profile?.squadId) {
      supabase.from("custom_exercises").upsert({
        id: exercise.id,
        squad_id: profile.squadId,
        created_by: profile.name,
        exercise,
      });
    }
  };
  const deleteCustomExercise = (id) => {
    setCustomExercises((prev) => prev.filter((e) => e.id !== id));
    if (supabase && profile?.squadId) {
      supabase.from("custom_exercises").delete().eq("id", id);
    }
  };

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
              onDeleteProfile={deleteProfile} onUpdateProfile={updateProfile}
              squadLeaderboard={squadLeaderboard}
              squadHistory={squadHistory}
              squadChallenges={squadChallenges}
              onSendChallenge={sendChallenge}
              onCompleteChallenge={completeChallenge}
              customWorkouts={customWorkouts}
              supabaseEnabled={!!supabase}
              onCreateSquad={createSquad}
              onJoinSquad={joinSquad}
              onLeaveSquad={leaveSquad}
              onSaveWorkout={saveCustomWorkout}
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
          <Route path="/history" element={<History history={history} profile={profile} allHistory={allHistory} profiles={profiles} onDeleteEntry={deleteHistoryEntry} onToggleDislike={toggleDislikedExercise} squadHistory={squadHistory} customWorkouts={customWorkouts} />} />
          <Route path="/create" element={
            <CreateWorkout
              onSaveWorkout={saveCustomWorkout}
              onSaveExercise={saveCustomExercise}
              onDeleteExercise={deleteCustomExercise}
              customExercises={customExercises}
            />
          } />
          <Route path="/log" element={
            <QuickLog customWorkouts={customWorkouts} onComplete={addToHistory} onSaveWorkout={saveCustomWorkout} />
          } />
          <Route path="/squad/:memberName" element={
            <SquadMemberHistory squadHistory={squadHistory} />
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Nav theme={theme} onToggleTheme={toggleTheme} />
      </div>
    </BrowserRouter>
  );
}
