import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { workouts as presetWorkouts } from "../data/workouts";
import { exerciseById } from "../data/exercises";
import BodyMap from "../components/BodyMap";
import ExercisePicker from "../components/ExercisePicker";

// â”€â”€â”€ Add-item detail prompt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AddItemPrompt({ item, phase, onConfirm, onCancel }) {
  const [detail, setDetail] = useState(
    phase === "main" ? "3 Ã— 10" : "30 sec"
  );

  const confirm = () => {
    const newItem = { exerciseId: item.exerciseId || null, name: item.name };
    const trimmed = detail.trim();
    const crossMatch = trimmed.match(/^(\d+)\s*[Ã—x]\s*(.+)$/i);
    if (crossMatch) {
      newItem.sets = parseInt(crossMatch[1]);
      newItem.reps = crossMatch[2].trim();
    } else {
      newItem.duration = trimmed || (phase === "main" ? "10 reps" : "30 sec");
    }
    onConfirm(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-700 pixel-card mx-4 mb-4 md:mb-0 p-5">
        <p className="font-display text-white mb-1" style={{ fontSize: "9px", letterSpacing: "0.15em" }}>
          ADD TO {phase.toUpperCase()}
        </p>
        <p className="text-neutral-400 text-sm mb-4">{item.name}</p>
        <label className="block font-display text-neutral-500 mb-2" style={{ fontSize: "7px", letterSpacing: "0.1em" }}>
          SETS Ã— REPS OR DURATION
        </label>
        <input
          autoFocus
          type="text"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirm()}
          placeholder="e.g. 3 Ã— 10  or  45 sec"
          className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm text-neutral-500 border border-neutral-800 pixel-btn-ghost">
            Cancel
          </button>
          <button
            onClick={confirm}
            className="flex-1 py-2.5 font-display text-neutral-950 pixel-btn"
            style={{ background: "var(--accent)", fontSize: "8px", letterSpacing: "0.12em" }}
          >
            ADD
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Exercise item (view + edit mode) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ExerciseItem({ item, allExercisesById, disliked = [], onToggleDislike, editing, onRemove }) {
  const ex = item.exerciseId ? (allExercisesById?.[item.exerciseId] ?? exerciseById[item.exerciseId]) : null;
  const name = ex?.name || item.name || "Exercise";
  const detail = item.sets
    ? `${item.sets} Ã— ${item.reps || item.duration}`
    : item.reps || item.duration || "";
  const isDisliked = item.exerciseId && disliked.includes(item.exerciseId);

  return (
    <div className={`bg-neutral-900 pixel-card p-4 mb-2 ${isDisliked && !editing ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm">{name}</p>
            {isDisliked && !editing && (
              <span className="font-display text-orange-500" style={{ fontSize: "6px" }}>EXCLUDED</span>
            )}
          </div>
          {detail && <p className="text-neutral-500 text-xs mt-0.5">{detail}</p>}
          {item.note && <p className="text-neutral-600 text-xs mt-1 italic">{item.note}</p>}
          {ex?.modification && !editing && (
            <p className="text-xs mt-1">
              <span className="text-neutral-600">Mod: </span>
              <span className="text-neutral-500">{ex.modification}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {editing ? (
            <button
              onClick={onRemove}
              className="w-7 h-7 flex items-center justify-center border border-red-900 bg-red-950 text-red-400 hover:bg-red-900 transition-colors text-sm"
              title="Remove exercise"
            >
              âœ•
            </button>
          ) : (
            <>
              {ex?.videoUrl && (
                <a
                  href={ex.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs px-2 py-1.5 bg-red-950 text-red-400 hover:bg-red-900 transition-colors border border-red-900"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M21.593 7.203a2.506 2.506 0 00-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 00-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.23.857.905 1.534 1.763 1.765 1.582.43 7.83.437 7.83.437s6.265.007 7.831-.403a2.515 2.515 0 001.767-1.763c.414-1.565.417-4.812.417-4.812s.02-3.265-.407-4.831zM9.996 15.005l.005-6 5.207 3.005-5.212 2.995z"/>
                  </svg>
                  Watch
                </a>
              )}
              {item.exerciseId && onToggleDislike && (
                <button
                  onClick={() => onToggleDislike(item.exerciseId)}
                  title={isDisliked ? "Remove from excluded" : "Exclude from my recommendations"}
                  className={`px-2 py-1.5 text-sm border transition-colors ${
                    isDisliked
                      ? "border-orange-700 bg-orange-950 text-orange-400 hover:bg-orange-900"
                      : "border-neutral-700 text-neutral-600 hover:border-orange-700 hover:text-orange-500"
                  }`}
                >
                  ðŸ‘Ž
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {ex && !editing && (
        <div className="mt-3 pt-3 border-t border-neutral-800">
          <BodyMap primary={ex.primary} secondary={ex.secondary} />
          <div className="flex flex-wrap gap-1 mt-2">
            {ex.primary.map((m) => (
              <span key={m} className="text-xs px-2 py-0.5 bg-lime-400/10 text-lime-400 border border-lime-400/20">{m}</span>
            ))}
            {ex.secondary.map((m) => (
              <span key={m} className="text-xs px-2 py-0.5 bg-neutral-800 text-neutral-500 border border-neutral-700">{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Phase section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Phase({ title, items, accentColor, allExercisesById, disliked, onToggleDislike, editing, onRemove, onAddClick }) {
  if (!editing && (!items || items.length === 0)) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-neutral-800" />
        <span className="font-display text-neutral-500" style={{ fontSize: "7px", letterSpacing: "0.15em", color: accentColor }}>
          {title}
        </span>
        <div className="h-px flex-1 bg-neutral-800" />
      </div>
      {items && items.map((item, i) => (
        <ExerciseItem
          key={i}
          item={item}
          allExercisesById={allExercisesById}
          disliked={disliked}
          onToggleDislike={onToggleDislike}
          editing={editing}
          onRemove={() => onRemove(i)}
        />
      ))}
      {editing && (
        <button
          onClick={onAddClick}
          className="w-full py-2.5 mt-1 text-xs font-display border border-dashed border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-400 transition-colors"
          style={{ fontSize: "7px", letterSpacing: "0.1em" }}
        >
          + ADD TO {title}
        </button>
      )}
    </div>
  );
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function WorkoutDetail({
  profile,
  customWorkouts = [],
  customExercises = [],
  workoutOverrides = {},
  onToggleDislike,
  onSaveWorkoutEdit,
  onResetWorkoutEdit,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const baseWorkout = [...(customWorkouts || []), ...presetWorkouts].find((w) => w.id === id);
  const workout     = workoutOverrides[id] || baseWorkout;

  const allExercisesById = {
    ...exerciseById,
    ...Object.fromEntries((customExercises || []).map((e) => [e.id, e])),
  };

  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPhase, setPickerPhase] = useState(null);
  const [pendingItem, setPendingItem] = useState(null);

  if (!workout) return (
    <div className="flex items-center justify-center min-h-screen text-neutral-500 text-sm">
      Not found. <Link to="/browse" className="ml-2 text-lime-400">Browse â†’</Link>
    </div>
  );

  const hasOverride = !!workoutOverrides[id];
  const isPreset    = !baseWorkout?.isCustom;

  const enterEdit = () => {
    setDraft({
      warmup:   [...(workout.warmup   || [])],
      main:     [...(workout.main     || [])],
      cooldown: [...(workout.cooldown || [])],
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
  };

  const removeFromPhase = (phase, index) => {
    setDraft((d) => ({ ...d, [phase]: d[phase].filter((_, i) => i !== index) }));
  };

  const openPickerForPhase = (phase) => {
    setPickerPhase(phase);
    setShowPicker(true);
  };

  const handlePickExercise = (item) => {
    setShowPicker(false);
    setPendingItem(item);
  };

  const confirmAddItem = (newItem) => {
    setDraft((d) => ({ ...d, [pickerPhase]: [...d[pickerPhase], newItem] }));
    setPendingItem(null);
    setPickerPhase(null);
  };

  const saveEdit = () => {
    onSaveWorkoutEdit?.({ ...workout, ...draft });
    setEditing(false);
    setDraft(null);
  };

  const resetToDefault = () => {
    onResetWorkoutEdit?.(id);
    setEditing(false);
    setDraft(null);
  };

  const gearOk = !profile || workout.equipment.every((e) => profile.equipment.includes(e)) || workout.equipment.length === 0;

  const displayWarmup   = editing ? draft.warmup   : (workout.warmup   || []);
  const displayMain     = editing ? draft.main     : (workout.main     || []);
  const displayCooldown = editing ? draft.cooldown : (workout.cooldown || []);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
      {showPicker && (
        <ExercisePicker
          customExercises={customExercises}
          onPick={handlePickExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
      {pendingItem && (
        <AddItemPrompt
          item={pendingItem}
          phase={pickerPhase}
          onConfirm={confirmAddItem}
          onCancel={() => { setPendingItem(null); setPickerPhase(null); }}
        />
      )}

      <button onClick={() => navigate(-1)} className="text-neutral-500 hover:text-neutral-300 text-sm mb-6 transition-colors">
        â† Back
      </button>

      {/* Header */}
      <div className="mb-6">
        {workout.isCustom && (
          <span className="font-display text-purple-400 block mb-1" style={{ fontSize: "7px" }}>CUSTOM WORKOUT</span>
        )}
        <p className="font-display mb-2" style={{ fontSize: "7px", letterSpacing: "0.15em", color: "var(--accent)" }}>
          {workout.subcategory || workout.category}
        </p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-white" style={{ fontSize: "18px", letterSpacing: "0.15em", lineHeight: "1.5" }}>
            {workout.title.toUpperCase()}
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {hasOverride && isPreset && !editing && (
              <button
                onClick={resetToDefault}
                className="font-display text-neutral-600 hover:text-orange-400 transition-colors border border-neutral-800 px-2 py-1"
                style={{ fontSize: "6px", letterSpacing: "0.1em" }}
                title="Reset to original"
              >
                RESET
              </button>
            )}
            <button
              onClick={editing ? cancelEdit : enterEdit}
              className={`font-display px-3 py-1.5 border transition-colors ${
                editing
                  ? "border-neutral-600 text-neutral-400 hover:text-neutral-300"
                  : "border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
              }`}
              style={{ fontSize: "7px", letterSpacing: "0.1em" }}
            >
              {editing ? "CANCEL" : "EDIT"}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500">
          <span>{workout.duration} min</span>
          <span className="text-neutral-700">Â·</span>
          <span>{workout.difficulty}</span>
          {hasOverride && isPreset && (
            <>
              <span className="text-neutral-700">Â·</span>
              <span className="font-display text-lime-400" style={{ fontSize: "7px" }}>EDITED</span>
            </>
          )}
          {!gearOk && (
            <>
              <span className="text-neutral-700">Â·</span>
              <span className="text-orange-400 text-xs">Missing equipment</span>
            </>
          )}
        </div>
        {!editing && <p className="text-neutral-500 text-sm mt-3 leading-relaxed">{workout.description}</p>}
      </div>

      {/* CTA (hidden in edit mode) */}
      {!editing && (
        <button
          onClick={() => navigate(`/session/${workout.id}`)}
          className="w-full py-4 font-display text-neutral-950 mb-8 pixel-btn transition-all"
          style={{ background: "var(--accent)", fontSize: "10px", letterSpacing: "0.15em" }}
        >
          START WORKOUT
        </button>
      )}

      {/* Phases */}
      {workout.isCustom ? (
        <>
          <Phase
            title="WARM-UP"
            items={displayWarmup}
            accentColor="#fb923c"
            allExercisesById={allExercisesById}
            disliked={profile?.dislikedExercises || []}
            onToggleDislike={onToggleDislike}
            editing={editing}
            onRemove={(i) => removeFromPhase("warmup", i)}
            onAddClick={() => openPickerForPhase("warmup")}
          />
          <Phase
            title="EXERCISES"
            items={displayMain}
            accentColor="var(--accent)"
            allExercisesById={allExercisesById}
            disliked={profile?.dislikedExercises || []}
            onToggleDislike={onToggleDislike}
            editing={editing}
            onRemove={(i) => removeFromPhase("main", i)}
            onAddClick={() => openPickerForPhase("main")}
          />
          <Phase
            title="COOL-DOWN"
            items={displayCooldown}
            accentColor="#38bdf8"
            allExercisesById={allExercisesById}
            disliked={profile?.dislikedExercises || []}
            onToggleDislike={onToggleDislike}
            editing={editing}
            onRemove={(i) => removeFromPhase("cooldown", i)}
            onAddClick={() => openPickerForPhase("cooldown")}
          />
        </>
      ) : (
        <>
          <Phase
            title="WARM-UP"
            items={displayWarmup}
            accentColor="#fb923c"
            allExercisesById={allExercisesById}
            disliked={profile?.dislikedExercises || []}
            onToggleDislike={onToggleDislike}
            editing={editing}
            onRemove={(i) => removeFromPhase("warmup", i)}
            onAddClick={() => openPickerForPhase("warmup")}
          />
          <Phase
            title="MAIN WORKOUT"
            items={displayMain}
            accentColor="var(--accent)"
            allExercisesById={allExercisesById}
            disliked={profile?.dislikedExercises || []}
            onToggleDislike={onToggleDislike}
            editing={editing}
            onRemove={(i) => removeFromPhase("main", i)}
            onAddClick={() => openPickerForPhase("main")}
          />
          <Phase
            title="COOL-DOWN"
            items={displayCooldown}
            accentColor="#38bdf8"
            allExercisesById={allExercisesById}
            disliked={profile?.dislikedExercises || []}
            onToggleDislike={onToggleDislike}
            editing={editing}
            onRemove={(i) => removeFromPhase("cooldown", i)}
            onAddClick={() => openPickerForPhase("cooldown")}
          />
        </>
      )}

      {/* Edit mode save bar */}
      {editing && (
        <div className="fixed bottom-20 md:bottom-0 left-0 md:left-20 right-0 bg-neutral-950 border-t border-neutral-800 px-4 py-3 flex gap-3 z-40">
          <button
            onClick={cancelEdit}
            className="flex-1 py-3 text-sm text-neutral-500 border border-neutral-800 pixel-btn-ghost transition-colors"
          >
            Cancel
          </button>
          {hasOverride && isPreset && (
            <button
              onClick={resetToDefault}
              className="py-3 px-4 text-xs font-display text-orange-400 border border-orange-900 bg-orange-950 hover:bg-orange-900 transition-colors"
              style={{ fontSize: "7px", letterSpacing: "0.1em" }}
            >
              RESET DEFAULT
            </button>
          )}
          <button
            onClick={saveEdit}
            className="flex-1 py-3 font-display text-neutral-950 pixel-btn"
            style={{ background: "var(--accent)", fontSize: "9px", letterSpacing: "0.12em" }}
          >
            SAVE CHANGES
          </button>
        </div>
      )}
    </div>
  );
}
