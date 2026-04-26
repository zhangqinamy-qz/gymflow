import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { workouts, CATEGORIES } from "../data/workouts";

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

export default function QuickLog({ customWorkouts = [], onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState("pick");
  const [selected, setSelected] = useState(null);
  const [customName, setCustomName] = useState("");
  const [search, setSearch] = useState("");

  const [duration,  setDuration]  = useState("");
  const [calories,  setCalories]  = useState("");
  const [distance,  setDistance]  = useState("");
  const [unit,      setUnit]      = useState("km");
  const [heartRate, setHeartRate] = useState("");

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

  const save = () => {
    const dur = parseInt(duration) || 0;
    if (!dur) return;
    const log = {
      title:        selected?.title || "Workout",
      category:     selected?.category || null,
      date:         new Date().toISOString(),
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
          onClick={() => setStep("pick")}
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
        </div>

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
