import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { exerciseById, EQUIPMENT, MUSCLES } from "../data/exercises";
import { CATEGORIES } from "../data/workouts";
import ExercisePicker from "../components/ExercisePicker";

const CATS = [CATEGORIES.RUNNING, CATEGORIES.BALL, CATEGORIES.STRENGTH, "Other"];
const ALL_MUSCLES = Object.values(MUSCLES);
const ALL_EQUIPMENT = Object.values(EQUIPMENT);
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

// ─── Warm-up / Cool-down recommendation logic ─────────────────────────────────

const UPPER_MUSCLES = ["Chest", "Shoulders", "Biceps", "Triceps", "Back", "Forearms"];
const LOWER_MUSCLES = ["Quads", "Hamstrings", "Glutes", "Hip Flexors", "Calves"];

const COOLDOWN_BY_MUSCLE = {
  Chest:          { exerciseId: "chest-opener",        duration: "45 sec" },
  Shoulders:      { exerciseId: "shoulder-stretch",    duration: "45 sec each arm" },
  Back:           { exerciseId: "childs-pose",          duration: "60 sec" },
  Biceps:         { exerciseId: "shoulder-stretch",    duration: "45 sec each arm" },
  Triceps:        { exerciseId: "shoulder-stretch",    duration: "45 sec each arm" },
  Forearms:       { exerciseId: "shoulder-stretch",    duration: "45 sec each arm" },
  Core:           { exerciseId: "childs-pose",          duration: "60 sec" },
  Glutes:         { exerciseId: "hip-flexor-stretch",  duration: "45 sec each side" },
  "Hip Flexors":  { exerciseId: "hip-flexor-stretch",  duration: "45 sec each side" },
  Quads:          { exerciseId: "quad-stretch",         duration: "45 sec each leg" },
  Hamstrings:     { exerciseId: "hamstring-stretch",   duration: "45 sec each leg" },
  Calves:         { exerciseId: "calf-stretch",         duration: "45 sec each leg" },
};

function generatePhases(mainItems, allExById) {
  const muscles = new Set();
  mainItems.forEach((item) => {
    if (item.exerciseId) {
      const ex = allExById[item.exerciseId];
      if (ex) {
        ex.primary?.forEach((m) => muscles.add(m));
        ex.secondary?.forEach((m) => muscles.add(m));
      }
    }
  });

  const muscleArr = [...muscles];
  const hasUpper = muscleArr.some((m) => UPPER_MUSCLES.includes(m));
  const hasLower = muscleArr.some((m) => LOWER_MUSCLES.includes(m));

  // Warmup
  const seen = new Set();
  const warmup = [];
  const addW = (e) => { if (!seen.has(e.exerciseId)) { seen.add(e.exerciseId); warmup.push(e); } };

  if (hasUpper)                addW({ exerciseId: "arm-circles",             duration: "30 sec each direction" });
  if (hasLower)                addW({ exerciseId: "leg-swing",               duration: "30 sec each leg" });
  if (hasLower)                addW({ exerciseId: "hip-circle",              duration: "30 sec each direction" });
                               addW({ exerciseId: "inchworm",                reps:     "5 reps" });
  if (hasLower)                addW({ exerciseId: "high-knees",              duration: "45 sec" });
  if (hasUpper && hasLower)    addW({ exerciseId: "world-greatest-stretch",  reps:     "3 each side" });
  if (warmup.length === 0) {
    addW({ exerciseId: "inchworm",   reps:     "5 reps" });
    addW({ exerciseId: "high-knees", duration: "45 sec" });
  }

  // Cooldown
  const cseen = new Set();
  const cooldown = [];
  muscleArr.forEach((m) => {
    const item = COOLDOWN_BY_MUSCLE[m];
    if (item && !cseen.has(item.exerciseId)) {
      cseen.add(item.exerciseId);
      cooldown.push({ ...item });
    }
  });
  if (cooldown.length === 0) cooldown.push({ exerciseId: "childs-pose", duration: "60 sec" });

  return { warmup, cooldown };
}

// ─── Exercise Creator ─────────────────────────────────────────────────────────

function MusclePicker({ label, selected, onChange, exclude = [] }) {
  const toggle = (m) =>
    selected.includes(m) ? onChange(selected.filter((x) => x !== m)) : onChange([...selected, m]);
  return (
    <div className="mb-4">
      <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">{label}</label>
      <div className="grid grid-cols-3 gap-1.5">
        {ALL_MUSCLES.map((m) => {
          const isExcluded = exclude.includes(m);
          const isSelected = selected.includes(m);
          return (
            <button
              key={m}
              disabled={isExcluded}
              onClick={() => toggle(m)}
              className={`py-1.5 px-2 text-xs border transition-all text-left ${
                isSelected ? "pixel-selected" :
                isExcluded ? "border-neutral-800 text-neutral-700 cursor-not-allowed" :
                "border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CreateExercise({ onSave, customExercises }) {
  const [name, setName]        = useState("");
  const [difficulty, setDiff]  = useState("Beginner");
  const [equipment, setEquip]  = useState([]);
  const [primary, setPrimary]  = useState([]);
  const [secondary, setSecond] = useState([]);
  const [videoUrl, setVideo]   = useState("");
  const [mod, setMod]          = useState("");
  const [saved, setSaved]      = useState(false);

  const toggleEquip = (e) =>
    setEquip((g) => g.includes(e) ? g.filter((x) => x !== e) : [...g, e]);

  const canSave = name.trim().length > 0 && primary.length > 0;

  const save = () => {
    onSave({
      id: `custom_ex_${Date.now()}`,
      name: name.trim(),
      difficulty, equipment, primary, secondary,
      videoUrl: videoUrl.trim() || null,
      modification: mod.trim() || null,
      isCustom: true,
    });
    setName(""); setEquip([]); setPrimary([]); setSecond([]);
    setVideo(""); setMod(""); setDiff("Beginner");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      {saved && (
        <div className="mb-4 py-2 px-4 border border-lime-400 bg-lime-400/10 text-lime-400 text-xs font-display" style={{ fontSize: "7px", letterSpacing: "0.1em" }}>
          EXERCISE SAVED ★
        </div>
      )}
      <div className="mb-4">
        <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Exercise Name *</label>
        <input type="text" placeholder="e.g. Cable Fly" value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 pixel-card"
        />
      </div>
      <div className="mb-4">
        <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Difficulty</label>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button key={d} onClick={() => setDiff(d)}
              className={`flex-1 py-2 text-xs border transition-all ${difficulty === d ? "pixel-selected" : "border-neutral-700 text-neutral-400 pixel-btn-ghost"}`}
            >{d}</button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Equipment</label>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_EQUIPMENT.map((e) => (
            <button key={e} onClick={() => toggleEquip(e)}
              className={`py-2 px-3 text-xs border transition-all text-left ${equipment.includes(e) ? "pixel-selected" : "border-neutral-700 text-neutral-400 hover:border-neutral-500"}`}
            >{e}</button>
          ))}
        </div>
      </div>
      <MusclePicker label="Primary Muscles *" selected={primary} onChange={setPrimary} exclude={secondary} />
      <MusclePicker label="Secondary Muscles" selected={secondary} onChange={setSecond} exclude={primary} />
      <div className="mb-4">
        <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">YouTube URL (optional)</label>
        <input type="url" placeholder="https://youtube.com/..." value={videoUrl}
          onChange={(e) => setVideo(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
        />
      </div>
      <div className="mb-6">
        <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Beginner Modification (optional)</label>
        <input type="text" placeholder="e.g. Use lighter weight" value={mod}
          onChange={(e) => setMod(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
        />
      </div>
      <button onClick={save} disabled={!canSave}
        className="w-full py-4 font-display text-neutral-950 text-xs disabled:opacity-40 pixel-btn transition-all"
        style={{ background: canSave ? "var(--accent)" : "#555", fontSize: "9px", letterSpacing: "0.12em" }}
      >
        SAVE EXERCISE
      </button>
      {customExercises.length > 0 && (
        <div className="mt-6">
          <p className="font-display text-neutral-600 mb-3" style={{ fontSize: "7px", letterSpacing: "0.12em" }}>MY EXERCISES ({customExercises.length})</p>
          <div className="flex flex-col gap-2">
            {customExercises.map((ex) => (
              <div key={ex.id} className="bg-neutral-900 pixel-card p-3 text-sm">
                <p className="text-white font-medium">{ex.name}</p>
                <p className="text-neutral-600 text-xs mt-0.5">{ex.difficulty} · {ex.primary.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rows ─────────────────────────────────────────────────────────────────────

function ExerciseRow({ item, index, onChange, onRemove }) {
  return (
    <div className="pixel-card bg-neutral-900 p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-neutral-600 text-xs w-5">{index + 1}.</span>
        <span className="text-white text-sm font-medium flex-1">{item.name}</span>
        <button onClick={onRemove} className="text-neutral-600 hover:text-red-400 px-1">✕</button>
      </div>
      <div className="flex gap-2 pl-7">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-neutral-600">Sets</label>
          <input type="number" min="1" value={item.sets}
            onChange={(e) => onChange({ ...item, sets: e.target.value })}
            className="w-14 bg-neutral-800 border border-neutral-700 text-white text-sm px-2 py-1 text-center"
          />
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          <label className="text-xs text-neutral-600">Reps / Duration</label>
          <input type="text" placeholder="e.g. 10 or 30 sec" value={item.repsOrDuration}
            onChange={(e) => onChange({ ...item, repsOrDuration: e.target.value })}
            className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm px-2 py-1"
          />
        </div>
      </div>
    </div>
  );
}

function PhaseRow({ item, index, onRemove, allExById }) {
  const name = item.exerciseId
    ? (allExById[item.exerciseId]?.name || item.exerciseId)
    : (item.name || "Exercise");
  const detail = item.sets
    ? `${item.sets} × ${item.reps || item.duration}`
    : item.reps || item.duration || "";
  return (
    <div className="pixel-card bg-neutral-900 p-3 mb-2 flex items-center gap-2">
      <span className="text-neutral-600 text-xs w-5">{index + 1}.</span>
      <div className="flex-1">
        <p className="text-white text-sm">{name}</p>
        {detail && <p className="text-neutral-600 text-xs mt-0.5">{detail}</p>}
      </div>
      <button onClick={onRemove} className="text-neutral-600 hover:text-red-400 px-1 text-sm">✕</button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CreateWorkout({ onSaveWorkout, onSaveExercise, customExercises = [] }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("workout");

  const [title, setTitle]       = useState("");
  const [category, setCategory] = useState(CATEGORIES.STRENGTH);
  const [duration, setDuration] = useState("30");
  const [items, setItems]       = useState([]);
  const [warmupItems, setWarmupItems]     = useState([]);
  const [cooldownItems, setCooldownItems] = useState([]);
  const [showPicker, setShowPicker]       = useState(false);
  const [phasePicker, setPhasePicker]     = useState(null); // "warmup" | "cooldown"
  const [generated, setGenerated]         = useState(false);

  const allExById = {
    ...exerciseById,
    ...Object.fromEntries(customExercises.map((e) => [e.id, e])),
  };

  const addExercise    = (item) => setItems((p) => [...p, item]);
  const updateItem     = (i, u) => setItems((p) => p.map((x, idx) => idx === i ? u : x));
  const removeItem     = (i)    => setItems((p) => p.filter((_, idx) => idx !== i));
  const removeWarmup   = (i)    => setWarmupItems((p) => p.filter((_, idx) => idx !== i));
  const removeCooldown = (i)    => setCooldownItems((p) => p.filter((_, idx) => idx !== i));

  const handleGenerate = () => {
    const { warmup, cooldown } = generatePhases(items, allExById);
    setWarmupItems(warmup);
    setCooldownItems(cooldown);
    setGenerated(true);
  };

  const handlePhasePick = (item) => {
    const newItem = { exerciseId: item.exerciseId || null, name: item.name, duration: "30 sec" };
    if (phasePicker === "warmup")   setWarmupItems((p) => [...p, newItem]);
    if (phasePicker === "cooldown") setCooldownItems((p) => [...p, newItem]);
    setPhasePicker(null);
  };

  const canSaveWorkout = title.trim().length > 0 && items.length > 0;

  const saveWorkout = () => {
    onSaveWorkout({
      id: `custom_${Date.now()}`,
      title: title.trim(),
      category,
      subcategory: null,
      difficulty: "Custom",
      duration: parseInt(duration) || 30,
      equipment: [],
      description: "Custom workout",
      isCustom: true,
      warmup: warmupItems,
      main: items.map((item) => ({
        exerciseId: item.exerciseId || null,
        name: item.name,
        sets: parseInt(item.sets) || 3,
        reps: item.repsOrDuration,
      })),
      cooldown: cooldownItems,
    });
    navigate("/browse");
  };

  const phaseSeparator = (label, color) => (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1 bg-neutral-800" />
      <span className="font-display" style={{ fontSize: "7px", letterSpacing: "0.15em", color }}>{label}</span>
      <div className="h-px flex-1 bg-neutral-800" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      {(showPicker || phasePicker) && (
        <ExercisePicker
          customExercises={customExercises}
          onPick={phasePicker ? handlePhasePick : addExercise}
          onClose={() => { setShowPicker(false); setPhasePicker(null); }}
        />
      )}

      <button onClick={() => navigate(-1)} className="text-neutral-500 hover:text-neutral-300 text-sm mb-6 transition-colors">
        ← Back
      </button>

      <h1 className="font-display text-white mb-6" style={{ fontSize: "14px", letterSpacing: "0.2em", lineHeight: "1.5" }}>
        CREATE
      </h1>

      {/* Tabs */}
      <div className="flex mb-6 border border-neutral-700">
        {[["workout", "WORKOUT"], ["exercise", "EXERCISE"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-3 font-display transition-all ${tab === key ? "bg-neutral-800 text-white" : "text-neutral-600 hover:text-neutral-400"}`}
            style={{ fontSize: "8px", letterSpacing: "0.12em" }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "workout" && (
        <div>
          {/* Meta */}
          <div className="mb-4">
            <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Workout Name</label>
            <input type="text" placeholder="e.g. Monday Push Day" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 pixel-card"
            />
          </div>
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 py-3 text-sm focus:outline-none"
              >
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Duration (min)</label>
              <input type="number" min="5" value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 py-3 text-sm text-center focus:outline-none"
              />
            </div>
          </div>

          {/* ── Warm-up ── */}
          {phaseSeparator("WARM-UP", "#fb923c")}
          {warmupItems.length === 0 ? (
            <p className="text-neutral-700 text-xs text-center py-3 mb-2">
              {items.length > 0 ? "Generate suggestions below, or add manually." : "Add exercises first to auto-generate."}
            </p>
          ) : (
            warmupItems.map((item, i) => (
              <PhaseRow key={i} item={item} index={i} allExById={allExById} onRemove={() => removeWarmup(i)} />
            ))
          )}
          <button
            onClick={() => setPhasePicker("warmup")}
            className="w-full py-2 text-xs font-display border border-dashed border-neutral-800 text-neutral-600 hover:border-neutral-600 hover:text-neutral-400 transition-colors mb-1"
            style={{ fontSize: "7px", letterSpacing: "0.1em" }}
          >
            + ADD TO WARM-UP
          </button>

          {/* ── Main exercises ── */}
          {phaseSeparator("MAIN WORKOUT", "var(--accent)")}
          {items.length === 0 && (
            <div className="text-center py-8 border border-dashed border-neutral-800 text-neutral-600 text-sm mb-3">
              No exercises yet.
            </div>
          )}
          {items.map((item, i) => (
            <ExerciseRow key={i} index={i} item={item}
              onChange={(u) => updateItem(i, u)}
              onRemove={() => removeItem(i)}
            />
          ))}
          <button
            onClick={() => setShowPicker(true)}
            className="w-full py-3 mt-1 text-sm font-medium text-neutral-400 border border-neutral-700 hover:border-neutral-500 pixel-btn-ghost transition-colors"
          >
            + Add Exercise
          </button>

          {/* Auto-generate button */}
          {items.length > 0 && (
            <button
              onClick={handleGenerate}
              className="w-full py-3 mt-3 font-display border transition-colors"
              style={{
                fontSize: "7px", letterSpacing: "0.12em",
                borderColor: generated ? "#6ea825" : "#4a4a4a",
                color: generated ? "#6ea825" : "#737373",
              }}
            >
              {generated ? "✓ WARM-UP & COOL-DOWN GENERATED — REGENERATE?" : "✦ AUTO-GENERATE WARM-UP & COOL-DOWN"}
            </button>
          )}

          {/* ── Cool-down ── */}
          {phaseSeparator("COOL-DOWN", "#38bdf8")}
          {cooldownItems.length === 0 ? (
            <p className="text-neutral-700 text-xs text-center py-3 mb-2">
              {items.length > 0 ? "Generate suggestions above, or add manually." : "Add exercises first to auto-generate."}
            </p>
          ) : (
            cooldownItems.map((item, i) => (
              <PhaseRow key={i} item={item} index={i} allExById={allExById} onRemove={() => removeCooldown(i)} />
            ))
          )}
          <button
            onClick={() => setPhasePicker("cooldown")}
            className="w-full py-2 text-xs font-display border border-dashed border-neutral-800 text-neutral-600 hover:border-neutral-600 hover:text-neutral-400 transition-colors mb-1"
            style={{ fontSize: "7px", letterSpacing: "0.1em" }}
          >
            + ADD TO COOL-DOWN
          </button>

          {/* Save */}
          <div className="mt-8">
            <button
              onClick={saveWorkout} disabled={!canSaveWorkout}
              className="w-full py-4 font-display text-neutral-950 text-xs disabled:opacity-40 pixel-btn"
              style={{ background: canSaveWorkout ? "var(--accent)" : "#555", fontSize: "9px", letterSpacing: "0.12em" }}
            >
              SAVE WORKOUT
            </button>
          </div>
        </div>
      )}

      {tab === "exercise" && (
        <CreateExercise onSave={onSaveExercise} customExercises={customExercises} />
      )}
    </div>
  );
}
