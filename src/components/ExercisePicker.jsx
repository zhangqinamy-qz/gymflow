import { useState } from "react";
import { exercises as libraryExercises } from "../data/exercises";

export default function ExercisePicker({ onPick, onClose, customExercises = [] }) {
  const [query, setQuery] = useState("");

  const allExercises = [...customExercises, ...libraryExercises];
  const filtered = allExercises
    .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 25);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-700 pixel-card mx-4 mb-4 md:mb-0 flex flex-col max-h-[75vh]">
        <div className="p-4 border-b border-neutral-800">
          <h3 className="font-display mb-3" style={{ color: "var(--accent)", fontSize: "9px", letterSpacing: "0.12em" }}>
            ADD EXERCISE
          </h3>
          <input
            autoFocus
            type="text"
            placeholder="Search exercises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 text-white text-sm px-3 py-2 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
          />
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {query.length > 1 && (
            <button
              onClick={() => { onPick({ exerciseId: null, name: query, sets: "3", repsOrDuration: "10" }); onClose(); }}
              className="w-full text-left px-3 py-2.5 text-xs border border-neutral-700 text-lime-400 hover:bg-neutral-900 mb-1 pixel-btn-ghost font-display"
              style={{ fontSize: "7px" }}
            >
              + ADD "{query.toUpperCase()}" AS CUSTOM
            </button>
          )}
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { onPick({ exerciseId: ex.id, name: ex.name, sets: "3", repsOrDuration: "10" }); onClose(); }}
              className="w-full text-left px-3 py-2.5 hover:bg-neutral-900 border-b border-neutral-800 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                {ex.isCustom && (
                  <span className="font-display text-purple-400" style={{ fontSize: "6px" }}>CUSTOM</span>
                )}
                <span className="text-white text-sm">{ex.name}</span>
              </div>
              <span className="block text-xs text-neutral-600 mt-0.5">
                {ex.difficulty} Â· {ex.primary?.join(", ")}
              </span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-neutral-800">
          <button onClick={onClose} className="w-full py-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
