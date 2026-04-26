import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { workouts, CATEGORIES } from "../data/workouts";

const ALL_CATS = ["All", CATEGORIES.RUNNING, CATEGORIES.BALL, CATEGORIES.STRENGTH, "Other"];
const ALL_DIFF = ["All", "Beginner", "Intermediate", "Advanced", "Custom"];

const catColor = {
  [CATEGORIES.RUNNING]:  "text-orange-400",
  [CATEGORIES.BALL]:     "text-sky-400",
  [CATEGORIES.STRENGTH]: "text-lime-400",
};

export default function Browse({ profile, customWorkouts = [], onDeleteCustom }) {
  const [cat, setCat]   = useState("All");
  const [diff, setDiff] = useState("All");
  const navigate = useNavigate();

  const allWorkouts = [...workouts, ...customWorkouts];

  const filtered = allWorkouts.filter((w) => {
    const catOk  = cat  === "All" || w.category === cat || (cat === "Other" && !Object.values(CATEGORIES).includes(w.category));
    const diffOk = diff === "All" || w.difficulty === diff;
    return catOk && diffOk;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-white" style={{ fontSize: "14px", letterSpacing: "0.2em" }}>WORKOUTS</h1>
        <Link
          to="/create"
          className="px-4 py-2 text-xs font-display text-neutral-950 pixel-btn"
          style={{ background: "var(--accent)", fontSize: "7px", letterSpacing: "0.1em" }}
        >
          + CREATE
        </Link>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2 no-scrollbar">
        {ALL_CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`flex-shrink-0 px-4 py-2 text-xs font-medium border transition-all ${
              cat === c ? "pixel-selected" : "border-neutral-700 text-neutral-500 hover:border-neutral-500"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Difficulty pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {ALL_DIFF.map((d) => (
          <button
            key={d}
            onClick={() => setDiff(d)}
            className={`flex-shrink-0 px-3 py-1.5 text-xs border transition-all ${
              diff === d ? "border-neutral-400 bg-neutral-700 text-white" : "border-neutral-800 text-neutral-600 hover:border-neutral-600"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="text-neutral-700 font-display mb-4" style={{ fontSize: "7px" }}>
        {filtered.length} WORKOUT{filtered.length !== 1 ? "S" : ""}
      </p>

      <div className="flex flex-col gap-3">
        {filtered.map((w) => {
          const gearOk = !profile || w.equipment.every((e) => profile.equipment.includes(e)) || w.equipment.length === 0;
          return (
            <div key={w.id} className="relative group">
              <Link
                to={`/workout/${w.id}`}
                className={`block bg-neutral-900 pixel-card p-4 hover:bg-neutral-800 transition-colors ${!gearOk ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-display ${catColor[w.category] || "text-neutral-500"}`} style={{ fontSize: "7px", letterSpacing: "0.1em" }}>
                        {w.subcategory || w.category}
                      </span>
                      {w.isCustom && (
                        <span className="font-display text-purple-400" style={{ fontSize: "6px" }}>CUSTOM</span>
                      )}
                    </div>
                    <h3 className="text-white font-semibold text-sm mt-1">{w.title}</h3>
                  </div>
                  <span className="text-neutral-600 text-xs flex-shrink-0">{w.duration}m</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-neutral-800 text-neutral-500 border border-neutral-700">{w.difficulty}</span>
                  {!gearOk && (
                    <span className="text-xs px-2 py-0.5 bg-orange-950 text-orange-400 border border-orange-900">
                      Missing equipment
                    </span>
                  )}
                </div>
              </Link>

              {/* Delete button for custom workouts */}
              {w.isCustom && (
                <button
                  onClick={(e) => { e.preventDefault(); onDeleteCustom(w.id); }}
                  className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 text-xs transition-all px-1"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-600 text-sm">
            No workouts match these filters.
          </div>
        )}
      </div>
    </div>
  );
}
