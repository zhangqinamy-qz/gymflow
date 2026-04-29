import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { workouts, CATEGORIES } from "../data/workouts";
import { MUSCLES } from "../data/exercises";

const SPORT_MUSCLES = new Set(["Volleyball", "Pickleball", "Tennis"]);
const BODY_PART_TAGS = [
  "Cardio",
  ...Object.values(MUSCLES).filter((m) => !SPORT_MUSCLES.has(m)),
  "Ball Sports",
];

const catColor = {
  [CATEGORIES.RUNNING]:  "text-orange-400",
  [CATEGORIES.BALL]:     "text-sky-400",
  [CATEGORIES.STRENGTH]: "text-lime-400",
};

const catBorder = {
  [CATEGORIES.RUNNING]:  "border-orange-900",
  [CATEGORIES.BALL]:     "border-sky-900",
  [CATEGORIES.STRENGTH]: "border-lime-900",
};

// Sport game keywords → auto-create a workout with the real game exercise
const SPORT_GAMES = {
  volleyball: {
    exerciseId: "volleyball-game",
    name:       "Volleyball Game",
    title:      "Volleyball",
    warmup:  [
      { exerciseId: "arm-circles",       duration: "30 sec each direction" },
      { exerciseId: "shoulder-stretch",  duration: "30 sec each arm"       },
      { exerciseId: "leg-swing",         duration: "30 sec each leg"       },
      { exerciseId: "high-knees",        duration: "45 sec"                },
    ],
    cooldown: [
      { exerciseId: "shoulder-stretch",  duration: "45 sec each arm"       },
      { exerciseId: "quad-stretch",      duration: "45 sec each leg"       },
      { exerciseId: "childs-pose",       duration: "60 sec"                },
    ],
  },
  tennis: {
    exerciseId: "tennis-game",
    name:       "Tennis Game",
    title:      "Tennis",
    warmup:  [
      { exerciseId: "arm-circles",       duration: "30 sec each direction" },
      { exerciseId: "shoulder-stretch",  duration: "30 sec each arm"       },
      { exerciseId: "leg-swing",         duration: "30 sec each leg"       },
      { exerciseId: "inchworm",          reps:     "5 reps"                },
    ],
    cooldown: [
      { exerciseId: "shoulder-stretch",  duration: "45 sec each arm"       },
      { exerciseId: "quad-stretch",      duration: "45 sec each leg"       },
      { exerciseId: "calf-stretch",      duration: "45 sec each leg"       },
    ],
  },
  pickleball: {
    exerciseId: "pickleball-game",
    name:       "Pickleball Game",
    title:      "Pickleball",
    warmup:  [
      { exerciseId: "arm-circles",       duration: "30 sec each direction" },
      { exerciseId: "leg-swing",         duration: "30 sec each leg"       },
      { exerciseId: "high-knees",        duration: "30 sec"                },
    ],
    cooldown: [
      { exerciseId: "shoulder-stretch",  duration: "45 sec each arm"       },
      { exerciseId: "quad-stretch",      duration: "45 sec each leg"       },
      { exerciseId: "calf-stretch",      duration: "45 sec each leg"       },
    ],
  },
};

const NL_KEYWORDS = [
  { words: ["run", "running", "ran", "jog", "jogging"], search: "run"   },
  { words: ["hiit"],                                search: "circuit"    },
  { words: ["upper body", "push day"],              search: "upper body push" },
  { words: ["pull day"],                            search: "upper body pull" },
  { words: ["lower body", "leg day", "legs"],       search: "lower body" },
  { words: ["core", "abs"],                         search: "core"       },
  { words: ["circuit"],                             search: "circuit"    },
  { words: ["tempo"],                               search: "tempo run"  },
  { words: ["interval"],                            search: "interval run" },
  { words: ["swim", "swimming", "swam"],            search: "swim"       },
  { words: ["yoga", "stretch", "stretching"],       search: "yoga"       },
  { words: ["bike", "biking", "cycling", "cycle"],  search: "cycling"    },
  { words: ["walk", "walking", "walked", "hike", "hiking"], search: "walk" },
  { words: ["gym", "lifting", "weights", "strength"], search: "full body" },
];

function parseNL(text, allWorkouts) {
  const lower = text.toLowerCase();

  // Duration: "1 hr 30 min", "90 mins", "1.5 hours", "45m", "1h"
  const H = "(?:hours?|hrs?|h)";
  const M = "(?:minutes?|mins?|m)";
  let duration = null;
  const hrMinMatch = lower.match(new RegExp(`(\\d+)\\s*${H}(?!\\w)\\s*(?:and\\s*)?(\\d+)\\s*${M}(?!\\w)`));
  if (hrMinMatch) {
    duration = parseInt(hrMinMatch[1]) * 60 + parseInt(hrMinMatch[2]);
  } else {
    const hrMatch  = lower.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${H}(?!\\w)`));
    const minMatch = lower.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${M}(?!\\w)`));
    if (hrMatch && !minMatch) duration = Math.round(parseFloat(hrMatch[1]) * 60);
    else if (minMatch)        duration = Math.round(parseFloat(minMatch[1]));
  }

  // Date: default today, support "yesterday"
  let date = new Date().toISOString();
  if (/yesterday/i.test(text)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString();
  }

  // Sport games: check dedicated map first
  for (const [sport, config] of Object.entries(SPORT_GAMES)) {
    if (lower.includes(sport)) {
      return { duration, date, selected: null, sportGame: config };
    }
  }

  // General activity → workout title search
  let selected = null;
  for (const { words, search } of NL_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) {
      const found = allWorkouts.find((w) => w.title.toLowerCase().includes(search));
      if (found) {
        selected = { title: found.title, category: found.category };
      } else {
        const label = words[0];
        selected = { title: label.charAt(0).toUpperCase() + label.slice(1), category: null };
      }
      break;
    }
  }

  return { duration, date, selected, sportGame: null };
}

export default function QuickLog({ customWorkouts = [], onComplete, onSaveWorkout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const presetDate = location.state?.date || null;
  const [step, setStep] = useState("pick");
  const [selected, setSelected] = useState(null);
  const [customName, setCustomName] = useState("");
  const [search, setSearch] = useState("");

  const [nlText,    setNlText]    = useState("");
  const [nlError,   setNlError]   = useState("");

  const [duration,  setDuration]  = useState("");
  const [calories,  setCalories]  = useState("");
  const [distance,  setDistance]  = useState("");
  const [unit,      setUnit]      = useState("km");
  const [heartRate, setHeartRate] = useState("");
  const [logDate,   setLogDate]   = useState(presetDate);
  const [bodyPart,  setBodyPart]  = useState(null);

  const allWorkouts = [...customWorkouts, ...workouts];
  const filtered = search.trim()
    ? allWorkouts.filter((w) => w.title.toLowerCase().includes(search.toLowerCase()))
    : allWorkouts;

  const grouped = {};
  filtered.forEach((w) => {
    const cat = w.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(w);
  });

  const pick = (workout) => {
    setSelected({ title: workout.title, category: workout.category });
    setStep("log");
  };

  const logCustom = () => {
    if (!customName.trim()) return;
    setSelected({ title: customName.trim(), category: null });
    setStep("log");
  };

  const handleNL = () => {
    if (!nlText.trim()) return;
    const { duration: dur, date, selected: sel, sportGame } = parseNL(nlText, allWorkouts);
    if (!dur) { setNlError("Couldn't find a duration — try e.g. \"tennis for 60 mins\""); return; }
    setNlError("");

    if (sportGame) {
      // Find an existing custom workout that already has this game exercise in its main phase
      let existing = allWorkouts.find((w) =>
        (w.main || []).some((e) => e.exerciseId === sportGame.exerciseId)
      );
      if (!existing) {
        existing = {
          id:          `custom_${Date.now()}`,
          title:       sportGame.title,
          category:    CATEGORIES.BALL,
          subcategory: null,
          difficulty:  "Custom",
          duration:    dur,
          equipment:   [],
          description: `Custom ${sportGame.title} workout`,
          isCustom:    true,
          warmup:      sportGame.warmup,
          main:        [{ exerciseId: sportGame.exerciseId, name: sportGame.name, duration: "Full game" }],
          cooldown:    sportGame.cooldown,
        };
        onSaveWorkout?.(existing);
      }
      setSelected({ title: existing.title, category: existing.category });
    } else {
      setSelected(sel || { title: nlText.trim(), category: null });
    }

    setDuration(String(dur));
    setLogDate(date);
    setStep("log");
  };

  const save = () => {
    const dur = parseInt(duration) || 0;
    if (!dur) return;
    const log = {
      title:        selected?.title || "Workout",
      category:     selected?.category || bodyPart || null,
      date:         logDate || new Date().toISOString(),
      duration:     dur,
      calories:     calories  ? parseInt(calories)   : null,
      distance:     distance  ? parseFloat(distance) : null,
      distanceUnit: unit,
      heartRate:    heartRate ? parseInt(heartRate)  : null,
    };
    onComplete(log);
    navigate("/");
  };

  if (step === "log") {
    const isRunning = selected?.category === CATEGORIES.RUNNING;
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
        <button
          onClick={() => { setStep("pick"); setLogDate(null); setBodyPart(null); }}
          className="text-neutral-600 hover:text-neutral-400 text-sm transition-colors mb-5"
        >
          ← Back
        </button>

        <div className="mb-5">
          <p className="font-display mb-1" style={{ color: "var(--accent)", fontSize: "18px" }}>★</p>
          <h1 className="font-display text-white mb-0.5" style={{ fontSize: "14px", letterSpacing: "0.15em" }}>
            LOG SESSION
          </h1>
          <p className="text-neutral-500 text-sm">{selected?.title}</p>
          {logDate && (
            <p className="text-neutral-600 text-xs mt-0.5">
              {new Date(logDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          )}
        </div>

        {/* Body part chips — only for unmatched/custom workouts */}
        {!selected?.category && (
          <div className="mb-4">
            <label className="block font-display text-neutral-500 mb-2" style={{ fontSize: "7px", letterSpacing: "0.12em" }}>
              BODY PARTS WORKED (OPTIONAL — DEFAULT: FULL BODY)
            </label>
            <div className="flex flex-wrap gap-2">
              {BODY_PART_TAGS.map((tag) => {
                const active = bodyPart === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setBodyPart(active ? null : tag)}
                    className="font-display px-3 py-1.5 border transition-colors"
                    style={{
                      fontSize: "7px",
                      letterSpacing: "0.1em",
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "#0a0a0a" : "var(--neutral-400, #a3a3a3)",
                      borderColor: active ? "var(--accent)" : "#404040",
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="mb-3">
          <label className="block font-display text-neutral-500 mb-1.5" style={{ fontSize: "7px", letterSpacing: "0.12em" }}>
            TIME (MIN)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 45"
            className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 pixel-card"
          />
        </div>

        {/* Calories */}
        <div className="mb-3">
          <label className="block font-display text-neutral-500 mb-1.5" style={{ fontSize: "7px", letterSpacing: "0.12em" }}>
            CALORIES BURNED (OPTIONAL)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="e.g. 280"
            className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 pixel-card"
          />
        </div>

        {/* Distance + heart rate for running */}
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
            <div className="mb-3">
              <label className="block font-display text-neutral-500 mb-1.5" style={{ fontSize: "7px", letterSpacing: "0.12em" }}>
                AVG HEART RATE (OPTIONAL)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="e.g. 148"
                  className="flex-1 bg-neutral-900 border border-neutral-700 text-white px-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 pixel-card"
                />
                <span className="flex items-center text-neutral-500 text-sm px-2">bpm</span>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-3 text-sm text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-400 pixel-btn-ghost transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!duration}
            className="flex-1 py-3 font-display text-neutral-950 pixel-btn disabled:opacity-40"
            style={{ background: "var(--accent)", fontSize: "9px", letterSpacing: "0.12em" }}
          >
            SAVE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      <h1 className="font-display text-white mb-1" style={{ fontSize: "14px", letterSpacing: "0.2em" }}>LOG</h1>
      <p className="text-neutral-600 text-xs mb-5">Pick a workout you already completed.</p>

      {/* Natural language quick log */}
      <div className="mb-5 p-4 bg-neutral-900 border border-neutral-800 pixel-card">
        <p className="font-display text-neutral-500 mb-2" style={{ fontSize: "7px", letterSpacing: "0.12em" }}>
          QUICK LOG — JUST DESCRIBE IT
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={nlText}
            onChange={(e) => { setNlText(e.target.value); setNlError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleNL()}
            placeholder="e.g. played tennis for 60 mins today"
            className="flex-1 bg-neutral-950 border border-neutral-700 text-white px-3 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 pixel-card"
          />
          <button
            onClick={handleNL}
            disabled={!nlText.trim()}
            className="px-4 py-2.5 font-display text-neutral-950 pixel-btn disabled:opacity-40"
            style={{ background: "var(--accent)", fontSize: "7px", letterSpacing: "0.1em" }}
          >
            LOG
          </button>
        </div>
        {nlError && (
          <p className="text-red-400 text-xs mt-2">{nlError}</p>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 border-t border-neutral-800" />
        <span className="font-display text-neutral-600" style={{ fontSize: "7px", letterSpacing: "0.12em" }}>OR BROWSE</span>
        <div className="flex-1 border-t border-neutral-800" />
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search workouts..."
        className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 pixel-card mb-5"
      />

      {/* Workout list grouped by category */}
      {Object.entries(grouped).map(([cat, ws]) => (
        <div key={cat} className="mb-6">
          <p className={`font-display mb-2 ${catColor[cat] || "text-neutral-400"}`} style={{ fontSize: "7px", letterSpacing: "0.15em" }}>
            {cat}
          </p>
          <div className="flex flex-col gap-1.5">
            {ws.map((w) => (
              <button
                key={w.id}
                onClick={() => pick(w)}
                className={`w-full text-left px-4 py-3 bg-neutral-900 border pixel-card hover:bg-neutral-800 transition-colors ${catBorder[w.category] || "border-neutral-800"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">{w.title}</span>
                  <span className="text-neutral-600 text-xs ml-2 flex-shrink-0">{w.duration}m</span>
                </div>
                <span className="text-neutral-600 text-xs">{w.difficulty}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Custom workout name */}
      <div className="border-t border-neutral-800 pt-5 mt-2">
        <p className="font-display text-neutral-500 mb-3" style={{ fontSize: "7px", letterSpacing: "0.12em" }}>
          OR LOG SOMETHING ELSE
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && logCustom()}
            placeholder="e.g. Morning run, Gym session..."
            className="flex-1 bg-neutral-900 border border-neutral-700 text-white px-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 pixel-card"
          />
          <button
            onClick={logCustom}
            disabled={!customName.trim()}
            className="px-4 py-2.5 font-display text-neutral-950 pixel-btn disabled:opacity-40"
            style={{ background: "var(--accent)", fontSize: "7px", letterSpacing: "0.1em" }}
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
}
