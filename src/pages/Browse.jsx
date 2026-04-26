import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { workouts, CATEGORIES } from "../data/workouts";
import { drills, SPORTS, SKILLS } from "../data/drills";

const ALL_CATS = ["All", CATEGORIES.RUNNING, CATEGORIES.BALL, CATEGORIES.STRENGTH, "Other"];
const ALL_DIFF = ["All", "Beginner", "Intermediate", "Advanced", "Custom"];

const catColor = {
  [CATEGORIES.RUNNING]:  "text-orange-400",
  [CATEGORIES.BALL]:     "text-sky-400",
  [CATEGORIES.STRENGTH]: "text-lime-400",
};

const sportColor = {
  [SPORTS.VOLLEYBALL]: "text-amber-400",
  [SPORTS.PICKLEBALL]: "text-emerald-400",
};

const playersBadge = {
  Solo:    { label: "Solo",    bg: "bg-neutral-800",    text: "text-neutral-400" },
  Partner: { label: "Partner", bg: "bg-sky-950",        text: "text-sky-400" },
  Team:    { label: "Team",    bg: "bg-purple-950",     text: "text-purple-400" },
};

function DrillCard({ drill }) {
  const [open, setOpen] = useState(false);
  const badge = playersBadge[drill.players] || playersBadge.Solo;

  return (
    <div className="bg-neutral-900 pixel-card mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`font-display ${sportColor[drill.sport] || "text-neutral-400"}`} style={{ fontSize: "6px", letterSpacing: "0.12em" }}>
                {drill.skill.toUpperCase()}
              </span>
              <span className={`font-display px-1.5 py-0.5 ${badge.bg} ${badge.text}`} style={{ fontSize: "6px" }}>
                {badge.label}
              </span>
            </div>
            <p className="text-white font-medium text-sm">{drill.name}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-neutral-600 text-xs">{drill.duration}</p>
            <p className="text-neutral-700 text-xs mt-1">{open ? "▲" : "▼"}</p>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-neutral-800 pt-3">
          <p className="text-neutral-400 text-sm leading-relaxed mb-3">{drill.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-neutral-800 text-neutral-500 border border-neutral-700">{drill.difficulty}</span>
            {drill.videoUrl && (
              <a
                href={drill.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-2 py-1 bg-red-950 text-red-400 hover:bg-red-900 border border-red-900 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M21.593 7.203a2.506 2.506 0 00-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 00-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.23.857.905 1.534 1.763 1.765 1.582.43 7.83.437 7.83.437s6.265.007 7.831-.403a2.515 2.515 0 001.767-1.763c.414-1.565.417-4.812.417-4.812s.02-3.265-.407-4.831zM9.996 15.005l.005-6 5.207 3.005-5.212 2.995z"/>
                </svg>
                Watch
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Browse({ profile, customWorkouts = [], onDeleteCustom }) {
  const [mode, setMode] = useState("workouts"); // "workouts" | "drills"
  const [cat,  setCat]  = useState("All");
  const [diff, setDiff] = useState("All");
  const [sport, setSport] = useState("All");
  const [skill, setSkill] = useState("All");
  const navigate = useNavigate();

  // ── Workouts ──────────────────────────────────────────────────────────────
  const allWorkouts = [...workouts, ...customWorkouts];
  const filteredWorkouts = allWorkouts.filter((w) => {
    const catOk  = cat  === "All" || w.category === cat || (cat === "Other" && !Object.values(CATEGORIES).includes(w.category));
    const diffOk = diff === "All" || w.difficulty === diff;
    return catOk && diffOk;
  });

  // ── Drills ────────────────────────────────────────────────────────────────
  const skillOptions = sport === "All"
    ? ["All", ...new Set([...SKILLS.VOLLEYBALL, ...SKILLS.PICKLEBALL])]
    : ["All", ...(SKILLS[sport.toUpperCase().replace(" ", "_")] || SKILLS[Object.keys(SPORTS).find(k => SPORTS[k] === sport)] || [])];

  const filteredDrills = drills.filter((d) => {
    const sportOk = sport === "All" || d.sport === sport;
    const skillOk = skill === "All" || d.skill === skill;
    return sportOk && skillOk;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-white" style={{ fontSize: "14px", letterSpacing: "0.2em" }}>BROWSE</h1>
        <Link
          to="/create"
          className="px-4 py-2 text-xs font-display text-neutral-950 pixel-btn"
          style={{ background: "var(--accent)", fontSize: "7px", letterSpacing: "0.1em" }}
        >
          + CREATE
        </Link>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-5">
        {["workouts", "drills"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 font-display text-xs border transition-all ${mode === m ? "pixel-selected" : "border-neutral-700 text-neutral-500 hover:border-neutral-500"}`}
            style={{ fontSize: "7px", letterSpacing: "0.1em" }}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── WORKOUTS MODE ──────────────────────────────────────────────────── */}
      {mode === "workouts" && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-2 no-scrollbar">
            {ALL_CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`flex-shrink-0 px-4 py-2 text-xs font-medium border transition-all ${cat === c ? "pixel-selected" : "border-neutral-700 text-neutral-500 hover:border-neutral-500"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
            {ALL_DIFF.map((d) => (
              <button key={d} onClick={() => setDiff(d)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs border transition-all ${diff === d ? "border-neutral-400 bg-neutral-700 text-white" : "border-neutral-800 text-neutral-600 hover:border-neutral-600"}`}>
                {d}
              </button>
            ))}
          </div>

          <p className="text-neutral-700 font-display mb-4" style={{ fontSize: "7px" }}>
            {filteredWorkouts.length} WORKOUT{filteredWorkouts.length !== 1 ? "S" : ""}
          </p>

          <div className="flex flex-col gap-3">
            {filteredWorkouts.map((w) => {
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
                          {w.isCustom && <span className="font-display text-purple-400" style={{ fontSize: "6px" }}>CUSTOM</span>}
                        </div>
                        <h3 className="text-white font-semibold text-sm mt-1">{w.title}</h3>
                      </div>
                      <span className="text-neutral-600 text-xs flex-shrink-0">{w.duration}m</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-neutral-800 text-neutral-500 border border-neutral-700">{w.difficulty}</span>
                      {!gearOk && <span className="text-xs px-2 py-0.5 bg-orange-950 text-orange-400 border border-orange-900">Missing equipment</span>}
                    </div>
                  </Link>
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
            {filteredWorkouts.length === 0 && (
              <div className="text-center py-12 text-neutral-600 text-sm">No workouts match these filters.</div>
            )}
          </div>
        </>
      )}

      {/* ── DRILLS MODE ────────────────────────────────────────────────────── */}
      {mode === "drills" && (
        <>
          {/* Sport filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-2 no-scrollbar">
            {["All", ...Object.values(SPORTS)].map((s) => (
              <button key={s} onClick={() => { setSport(s); setSkill("All"); }}
                className={`flex-shrink-0 px-4 py-2 text-xs font-medium border transition-all ${sport === s ? "pixel-selected" : "border-neutral-700 text-neutral-500 hover:border-neutral-500"}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Skill filter */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
            {skillOptions.map((s) => (
              <button key={s} onClick={() => setSkill(s)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs border transition-all ${skill === s ? "border-neutral-400 bg-neutral-700 text-white" : "border-neutral-800 text-neutral-600 hover:border-neutral-600"}`}>
                {s}
              </button>
            ))}
          </div>

          <p className="text-neutral-700 font-display mb-4" style={{ fontSize: "7px" }}>
            {filteredDrills.length} DRILL{filteredDrills.length !== 1 ? "S" : ""}
          </p>

          <div>
            {filteredDrills.map((d) => <DrillCard key={d.id} drill={d} />)}
            {filteredDrills.length === 0 && (
              <div className="text-center py-12 text-neutral-600 text-sm">No drills match these filters.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
