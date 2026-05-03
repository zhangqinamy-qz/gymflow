import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { workouts, CATEGORIES } from "../data/workouts";
import { exerciseById } from "../data/exercises";
import BodyMap from "../components/BodyMap";
import { getSessionCategories } from "../lib/diversityUtils";

function buildSteps(workout) {
  if (workout.isCustom) {
    return workout.main.map((item) => {
      const ex = item.exerciseId ? exerciseById[item.exerciseId] : null;
      return { ...item, phase: "Exercise", ex, name: ex?.name || item.name || "Exercise" };
    });
  }
  const steps = [];
  const add = (phase, items) =>
    (items || []).forEach((item) => {
      const ex = item.exerciseId ? exerciseById[item.exerciseId] : null;
      steps.push({ ...item, phase, ex, name: ex?.name || item.name || "Exercise" });
    });
  add("Warm-up", workout.warmup);
  add("Main", workout.main);
  add("Cool-down", workout.cooldown);
  return steps;
}

const phaseColors = {
  "Warm-up":   "#fb923c",
  "Main":      "var(--accent)",
  "Cool-down": "#38bdf8",
  "Exercise":  "var(--accent)",
};

function LogForm({ workout, elapsedMin, onSubmit }) {
  const isRunning = workout.category === CATEGORIES.RUNNING;

  const [duration,   setDuration]   = useState(String(elapsedMin));
  const [calories,   setCalories]   = useState("");
  const [distance,   setDistance]   = useState("");
  const [unit,       setUnit]       = useState("km");
  const [heartRate,  setHeartRate]  = useState("");

  const submit = () => {
    const dur = parseInt(duration) || elapsedMin;
    onSubmit({
      duration:  dur,
      stars:     dur >= 60 ? 3 : dur >= 45 ? 2 : 1,
      calories:  calories  ? parseInt(calories)  : null,
      distance:  distance  ? parseFloat(distance): null,
      distanceUnit: unit,
      heartRate: heartRate ? parseInt(heartRate) : null,
    });
  };

  const Field = ({ label, value, onChange, placeholder, inputMode = "numeric", suffix }) => (
    <div className="mb-3">
      <label className="block font-display text-neutral-500 mb-1.5" style={{ fontSize: "7px", letterSpacing: "0.12em" }}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-neutral-900 border border-neutral-700 text-white px-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 pixel-card"
        />
        {suffix && <span className="flex items-center text-neutral-500 text-sm px-2">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col px-4 pt-4 max-w-md mx-auto">
      <div className="mb-3">
        <p className="font-display mb-1" style={{ color: "var(--accent)", fontSize: "18px" }}>★</p>
        <h2 className="font-display text-white mb-0.5" style={{ fontSize: "14px", letterSpacing: "0.15em", lineHeight: "1.5" }}>
          LOG SESSION
        </h2>
        <p className="text-neutral-600 text-sm">{workout.title}</p>
      </div>

      <Field
        label="TIME (MIN)"
        value={duration}
        onChange={setDuration}
        placeholder={String(elapsedMin)}
      />
      <Field
        label="CALORIES BURNED (OPTIONAL)"
        value={calories}
        onChange={setCalories}
        placeholder="e.g. 280"
      />

      {isRunning && (
        <>
          <div className="mb-3">
            <label className="block font-display text-neutral-500 mb-1.5" style={{ fontSize: "7px", letterSpacing: "0.12em" }}>
              DISTANCE (OPTIONAL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="e.g. 5.2"
                className="flex-1 bg-neutral-900 border border-neutral-700 text-white px-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 pixel-card"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-white px-3 py-2.5 text-sm focus:outline-none"
              >
                <option value="km">km</option>
                <option value="mi">mi</option>
              </select>
            </div>
          </div>
          <Field
            label="AVG HEART RATE (OPTIONAL)"
            value={heartRate}
            onChange={setHeartRate}
            placeholder="e.g. 148"
            suffix="bpm"
          />
        </>
      )}

      <div className="flex gap-3 mt-3">
        <button
          onClick={() => onSubmit({ duration: elapsedMin, stars: elapsedMin >= 60 ? 3 : elapsedMin >= 45 ? 2 : 1, calories: null, distance: null, heartRate: null })}
          className="flex-1 py-3 text-sm text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-400 pixel-btn-ghost transition-colors"
        >
          Skip
        </button>
        <button
          onClick={submit}
          className="flex-2 flex-1 py-3 font-display text-neutral-950 pixel-btn"
          style={{ background: "var(--accent)", fontSize: "9px", letterSpacing: "0.12em" }}
        >
          SAVE
        </button>
      </div>
    </div>
  );
}

export default function ActiveSession({ customWorkouts = [], customExercises = [], profile, onComplete, onToggleDislike }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const workout = [...customWorkouts, ...workouts].find((w) => w.id === id);

  const allExercisesById = {
    ...exerciseById,
    ...Object.fromEntries((customExercises || []).map((e) => [e.id, e])),
  };

  const [steps]     = useState(() => {
    if (!workout) return [];
    const out = [];
    const add = (phase, items) =>
      (items || []).forEach((item) => {
        const ex = item.exerciseId ? allExercisesById[item.exerciseId] : null;
        out.push({ ...item, phase, ex, name: ex?.name || item.name || "Exercise" });
      });
    add("Warm-up", workout.warmup);
    add(workout.isCustom ? "Exercise" : "Main", workout.main);
    add("Cool-down", workout.cooldown);
    return out;
  });

  const [current,    setCurrent]    = useState(0);
  const [phase,      setPhase]      = useState("active"); // "active" | "logging" | "done"
  const [startTime]                 = useState(Date.now());
  const [loggedData, setLoggedData] = useState(null);
  const [transition, setTransition] = useState(null); // null | "toMain" | "toCool"

  if (!workout) return (
    <div className="flex items-center justify-center min-h-screen text-neutral-500 text-sm">Workout not found.</div>
  );

  if (phase === "done") {
    const starsEarned = loggedData?.stars || 1;
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display mb-2" style={{ fontSize: "40px", color: "var(--accent)", letterSpacing: "6px" }}>
          {"★".repeat(starsEarned)}{"☆".repeat(3 - starsEarned)}
        </p>
        <h1 className="font-display text-white mb-1" style={{ fontSize: "20px", letterSpacing: "0.2em", color: "var(--accent)" }}>
          {starsEarned === 3 ? "LEGENDARY!" : starsEarned === 2 ? "GREAT WORK!" : "DONE!"}
        </h1>
        <p className="font-display text-neutral-500 mb-1" style={{ fontSize: "8px" }}>
          {starsEarned === 3 ? "+3 STARS — OVER 60 MIN!" : starsEarned === 2 ? "+2 STARS — OVER 45 MIN!" : "+1 STAR"}
        </p>
        <p className="text-neutral-600 text-sm mt-2">{workout.title}</p>
        {loggedData && (
          <div className="flex gap-4 mt-2 text-neutral-600 text-xs">
            <span>{loggedData.duration}m</span>
            {loggedData.calories && <span>{loggedData.calories} cal</span>}
            {loggedData.distance && <span>{loggedData.distance} {loggedData.distanceUnit}</span>}
            {loggedData.heartRate && <span>♥ {loggedData.heartRate} bpm</span>}
          </div>
        )}
        <button
          onClick={() => navigate("/")}
          className="mt-8 py-4 px-10 font-display text-neutral-950 pixel-btn"
          style={{ background: "var(--accent)", fontSize: "9px", letterSpacing: "0.15em" }}
        >
          HOME
        </button>
      </div>
    );
  }

  if (phase === "logging") {
    const elapsedMin = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    return (
      <LogForm
        workout={workout}
        elapsedMin={elapsedMin}
        onSubmit={(data) => {
          const log = {
            title: workout.title,
            category: workout.category,
            categories: getSessionCategories(workout, allExercisesById),
            date: new Date().toISOString(),
            ...data,
          };
          setLoggedData(data);
          onComplete(log);
          setPhase("done");
        }}
      />
    );
  }

  // Active phase
  const step = steps[current];
  const progress = (current / steps.length) * 100;
  const isLast = current === steps.length - 1;
  const phaseColor = phaseColors[step?.phase] || "var(--accent)";

  const detail = step?.ex?.isGame
    ? "Play game"
    : step?.sets
      ? `${step.sets} × ${step.reps || step.duration}`
      : step?.reps || step?.duration || "";

  const skipWarmup = () => {
    const idx = steps.findIndex((s) => s.phase !== "Warm-up" && s.phase !== "Cool-down");
    setCurrent(idx >= 0 ? idx : steps.length - 1);
    setTransition(null);
  };

  const skipMain = () => {
    const idx = steps.findIndex((s) => s.phase === "Cool-down");
    setTransition(null);
    if (idx >= 0) setCurrent(idx); else setPhase("logging");
  };

  const skipCooldown = () => { setTransition(null); setPhase("logging"); };

  const advance = () => {
    if (isLast) { setPhase("logging"); return; }
    const cur  = step?.phase;
    const next = steps[current + 1]?.phase;
    if (cur === "Warm-up" && next !== "Warm-up") {
      setTransition("toMain");
    } else if (cur !== "Cool-down" && next === "Cool-down") {
      setTransition("toCool");
    } else {
      setCurrent((c) => c + 1);
    }
  };

  // ── Transition card: warm-up → main ──────────────────────────────────────
  if (transition === "toMain") {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-white mb-4" style={{ fontSize: "56px", lineHeight: 1 }}>Ready?</p>
        <p className="text-neutral-400 text-lg mb-12 max-w-xs leading-relaxed">Let's go to main exercise!</p>
        <button
          onClick={() => { setTransition(null); setCurrent((c) => c + 1); }}
          className="w-full max-w-xs py-4 font-display text-neutral-950 pixel-btn mb-5"
          style={{ background: "var(--accent)", fontSize: "9px", letterSpacing: "0.15em" }}
        >
          LET'S GO →
        </button>
        <button onClick={skipMain} className="text-neutral-700 hover:text-neutral-500 text-sm transition-colors">
          Skip main exercise →
        </button>
      </div>
    );
  }

  // ── Transition card: main → cool-down ────────────────────────────────────
  if (transition === "toCool") {
    return (
      <div className="min-h-screen bg-sky-950 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-white mb-4" style={{ fontSize: "56px", lineHeight: 1 }}>Good Job!</p>
        <p className="text-neutral-400 text-lg mb-12 max-w-xs leading-relaxed">
          Cool downs are important,<br />otherwise you will be sore.
        </p>
        <button
          onClick={() => { setTransition(null); setCurrent((c) => c + 1); }}
          className="w-full max-w-xs py-4 font-display text-neutral-950 pixel-btn mb-5"
          style={{ background: "var(--accent)", fontSize: "9px", letterSpacing: "0.15em" }}
        >
          START COOL-DOWN
        </button>
        <button onClick={skipCooldown} className="text-neutral-700 hover:text-neutral-500 text-sm transition-colors">
          Skip cool-down →
        </button>
      </div>
    );
  }

  // ── Phase background ──────────────────────────────────────────────────────
  const phaseBg =
    step?.phase === "Warm-up"   ? "bg-orange-950" :
    step?.phase === "Cool-down" ? "bg-sky-950"    :
    "bg-neutral-950";

  return (
    <div className={`min-h-screen ${phaseBg} flex flex-col transition-colors duration-700`}>
      {/* Progress bar */}
      <div className="h-0.5 bg-neutral-900">
        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--accent)" }} />
      </div>

      {/* Top bar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-neutral-600 hover:text-neutral-400 text-sm transition-colors">
          ✕ Quit
        </button>
        <span className="font-display text-neutral-600" style={{ fontSize: "7px" }}>
          {current + 1} / {steps.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 pt-4 max-w-md mx-auto w-full">
        <span className="font-display mb-2" style={{ fontSize: "7px", letterSpacing: "0.15em", color: phaseColor }}>
          {step?.phase?.toUpperCase()}
        </span>
        <h2 className="font-display text-white mb-3" style={{ fontSize: "16px", letterSpacing: "0.1em", lineHeight: "1.5" }}>
          {step?.name?.toUpperCase()}
        </h2>

        {detail && <p className="text-2xl font-semibold mb-2" style={{ color: phaseColor }}>{detail}</p>}
        {step?.note && <p className="text-neutral-500 text-sm italic mb-2">{step.note}</p>}
        {step?.ex?.modification && (
          <p className="text-sm text-neutral-700 mb-4">
            <span className="text-neutral-600">Mod: </span>{step.ex.modification}
          </p>
        )}

        {/* Dislike toggle */}
        {step?.ex && step?.exerciseId && onToggleDislike && (
          <button
            onClick={() => onToggleDislike(step.exerciseId)}
            className={`flex items-center gap-2 text-xs mb-3 px-3 py-2 border transition-colors ${
              (profile?.dislikedExercises || []).includes(step.exerciseId)
                ? "border-orange-700 bg-orange-950 text-orange-400"
                : "border-neutral-800 text-neutral-600 hover:border-orange-800 hover:text-orange-600"
            }`}
          >
            👎 {(profile?.dislikedExercises || []).includes(step.exerciseId) ? "Remove from excluded" : "Exclude from my recommendations"}
          </button>
        )}

        {step?.ex && (
          <div className="bg-neutral-900 pixel-card p-4 mb-4">
            <BodyMap primary={step.ex.primary} secondary={step.ex.secondary} />
            <div className="mt-3 flex flex-wrap gap-1 justify-center">
              {step.ex.primary?.map((m) => (
                <span key={m} className="text-xs px-2 py-0.5 bg-lime-400/10 text-lime-400 border border-lime-400/20">{m}</span>
              ))}
              {step.ex.secondary?.map((m) => (
                <span key={m} className="text-xs px-2 py-0.5 bg-neutral-800 text-neutral-500 border border-neutral-700">{m}</span>
              ))}
            </div>
          </div>
        )}

        {step?.ex?.videoUrl && (
          <a
            href={step.ex.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 mb-4 bg-red-950 text-red-400 hover:bg-red-900 text-sm font-medium border border-red-900 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M21.593 7.203a2.506 2.506 0 00-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 00-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.23.857.905 1.534 1.763 1.765 1.582.43 7.83.437 7.83.437s6.265.007 7.831-.403a2.515 2.515 0 001.767-1.763c.414-1.565.417-4.812.417-4.812s.02-3.265-.407-4.831zM9.996 15.005l.005-6 5.207 3.005-5.212 2.995z"/>
            </svg>
            Watch Form on YouTube
          </a>
        )}

        <div className="flex-1" />

        <div className="text-center mb-2">
          <button onClick={advance} className="text-neutral-700 hover:text-neutral-500 text-xs transition-colors">
            Skip this exercise →
          </button>
        </div>

        {step?.phase === "Warm-up" && (
          <div className="text-center mb-3">
            <button onClick={skipWarmup} className="text-neutral-700 hover:text-neutral-500 text-xs transition-colors">
              Skip warm-up →
            </button>
          </div>
        )}
        {step?.phase === "Cool-down" && (
          <div className="text-center mb-3">
            <button onClick={skipCooldown} className="text-neutral-700 hover:text-neutral-500 text-xs transition-colors">
              Skip cool-down →
            </button>
          </div>
        )}

        <div className="flex gap-3 pb-20">
          {current > 0 && (
            <button
              onClick={() => setCurrent((c) => c - 1)}
              className="flex-1 py-4 text-sm font-medium text-neutral-300 border border-neutral-700 pixel-btn-ghost"
            >
              ← Back
            </button>
          )}
          <button
            onClick={advance}
            className="flex-1 py-4 font-display text-neutral-950 pixel-btn"
            style={{ background: "var(--accent)", fontSize: "9px", letterSpacing: "0.15em" }}
          >
            {isLast ? "FINISH ★" : "NEXT →"}
          </button>
        </div>
      </div>
    </div>
  );
}
