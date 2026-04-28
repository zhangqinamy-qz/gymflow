import { useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/workouts";
import { exerciseById } from "../data/exercises";

const PROFILE_COLORS = ["var(--accent)", "#38bdf8", "#f472b6", "#fb923c", "#a78bfa", "#34d399"];

const catTag = {
  [CATEGORIES.RUNNING]:  "text-orange-400 border-orange-900 bg-orange-950",
  [CATEGORIES.BALL]:     "text-sky-400 border-sky-900 bg-sky-950",
  [CATEGORIES.STRENGTH]: "text-lime-400 border-lime-900 bg-lime-950",
};

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const DAY_LABELS = ["S","M","T","W","T","F","S"];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function Calendar({ allHistory, profiles, squadHistory = {} }) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Build dayMap: "YYYY-MM-DD" → { [key]: { color, stars, name } }
  const dayMap = {};
  const localNames = new Set(profiles.map((p) => p.name.toLowerCase()));

  profiles.forEach((p, i) => {
    const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
    (allHistory[p.id] || []).forEach((log) => {
      const key = log.date.slice(0, 10);
      if (!dayMap[key]) dayMap[key] = {};
      if (!dayMap[key][p.id]) dayMap[key][p.id] = { color, stars: 0, name: p.name };
      dayMap[key][p.id].stars = Math.max(dayMap[key][p.id].stars, log.stars || 1);
    });
  });

  // Squad members not in local profiles
  const squadMembers = Object.entries(squadHistory)
    .filter(([name]) => !localNames.has(name.toLowerCase()));
  squadMembers.forEach(([name, sessions], i) => {
    const color = PROFILE_COLORS[(profiles.length + i) % PROFILE_COLORS.length];
    sessions.forEach((log) => {
      const key = log.date.slice(0, 10);
      if (!dayMap[key]) dayMap[key] = {};
      const dotKey = `squad_${name}`;
      if (!dayMap[key][dotKey]) dayMap[key][dotKey] = { color, stars: 0, name };
      dayMap[key][dotKey].stars = Math.max(dayMap[key][dotKey].stars, log.stars || 1);
    });
  });

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey    = now.toISOString().slice(0, 10);

  // Pad start + day numbers
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="bg-neutral-900 pixel-card p-4 mb-8">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-neutral-600 hover:text-neutral-400 px-2 py-1 text-sm transition-colors">←</button>
        <span className="font-display text-white" style={{ fontSize: "9px", letterSpacing: "0.15em" }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="text-neutral-600 hover:text-neutral-400 px-2 py-1 text-sm transition-colors">→</button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center font-display text-neutral-700" style={{ fontSize: "6px", letterSpacing: "0.05em" }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-10" />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const profileEntries = Object.values(dayMap[key] || {});
          const hasWorkout = profileEntries.length > 0;
          const isToday    = key === todayKey;
          const maxStars   = hasWorkout ? Math.max(...profileEntries.map((e) => e.stars)) : 0;

          return (
            <div
              key={i}
              className={`h-10 flex flex-col items-center justify-start pt-1 ${
                isToday ? "border border-neutral-600" : ""
              }`}
            >
              <span
                className="font-display leading-none"
                style={{
                  fontSize: "7px",
                  color: hasWorkout ? "#fff" : "#404040",
                }}
              >
                {day}
              </span>

              {/* Per-profile dots */}
              {hasWorkout && (
                <div className="flex flex-wrap justify-center gap-px mt-0.5">
                  {profileEntries.slice(0, 4).map((e, j) => (
                    <div key={j} className="w-1.5 h-1.5 flex-shrink-0" style={{ background: e.color }} />
                  ))}
                </div>
              )}

              {/* Stars */}
              {maxStars > 0 && (
                <span style={{ color: "var(--accent)", fontSize: "5px", lineHeight: 1, marginTop: "1px" }}>
                  {"★".repeat(maxStars === 3 ? 3 : 1)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {(profiles.length > 0 || squadMembers.length > 0) && (
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-neutral-800">
          {profiles.map((p, i) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <div className="w-2 h-2 flex-shrink-0" style={{ background: PROFILE_COLORS[i % PROFILE_COLORS.length] }} />
              <span className="text-neutral-600 text-xs">{p.name}</span>
            </div>
          ))}
          {squadMembers.map(([name], i) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 flex-shrink-0" style={{ background: PROFILE_COLORS[(profiles.length + i) % PROFILE_COLORS.length] }} />
              <span className="text-neutral-600 text-xs">{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function History({ history, profile, allHistory = {}, profiles = [], onDeleteEntry, onToggleDislike, squadHistory = {} }) {
  const totalMin = history.reduce((s, h) => s + (h.duration || 0), 0);
  const thisWeek = history.filter((h) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return new Date(h.date) >= cutoff;
  }).length;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-6">
      <h1 className="font-display text-white mb-1" style={{ fontSize: "14px", letterSpacing: "0.2em" }}>HISTORY</h1>
      {profile && <p className="text-neutral-600 text-xs mb-6">{profile.name}</p>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[
          { label: "SESSIONS",  value: history.length },
          { label: "MIN",       value: totalMin },
          { label: "THIS WEEK", value: thisWeek },
        ].map(({ label, value }) => (
          <div key={label} className="bg-neutral-900 pixel-card p-4 text-center">
            <p className="font-display mb-1" style={{ color: "var(--accent)", fontSize: "22px" }}>{value}</p>
            <p className="font-display text-neutral-600" style={{ fontSize: "6px", letterSpacing: "0.1em" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Calendar allHistory={allHistory} profiles={profiles} squadHistory={squadHistory} />

      {history.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-neutral-700 mb-4" style={{ fontSize: "24px" }}>[ ]</p>
          <p className="text-neutral-600 text-sm">No workouts logged yet.</p>
          <Link to="/browse" className="inline-block mt-4 text-lime-400 text-sm hover:text-lime-300 transition-colors">
            Browse workouts →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((log, i) => (
            <div key={i} className="bg-neutral-900 pixel-card p-4 group relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium">{log.title}</p>
                    <span style={{ color: "var(--accent)", fontSize: "10px", letterSpacing: "1px" }}>
                      {"★".repeat(log.stars || 1)}
                    </span>
                  </div>
                  <p className="text-neutral-600 text-xs mt-0.5">{formatDate(log.date)}</p>

                  <div className="flex flex-wrap gap-3 mt-2">
                    {log.duration > 0 && (
                      <span className="text-neutral-500 text-xs">{log.duration} min</span>
                    )}
                    {log.calories && (
                      <span className="text-orange-400 text-xs">{log.calories} cal</span>
                    )}
                    {log.distance && (
                      <span className="text-sky-400 text-xs">{log.distance} {log.distanceUnit}</span>
                    )}
                    {log.heartRate && (
                      <span className="text-red-400 text-xs">♥ {log.heartRate} bpm</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {log.category && (
                    <span className={`font-display px-2 py-0.5 border ${catTag[log.category] || "text-neutral-400 border-neutral-700 bg-neutral-800"}`} style={{ fontSize: "6px" }}>
                      {log.category}
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteEntry(i)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-red-500 transition-all text-sm px-1"
                    title="Delete entry"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disliked Exercises */}
      {(profile?.dislikedExercises?.length > 0) && (
        <div className="mt-8">
          <h2 className="font-display text-white mb-1" style={{ fontSize: "9px", letterSpacing: "0.12em" }}>
            EXCLUDED EXERCISES
          </h2>
          <p className="text-neutral-600 text-xs mb-3">
            {profile.name}'s excluded list — tap 👎 to restore.
          </p>
          <div className="flex flex-col gap-2">
            {profile.dislikedExercises.map((id) => {
              const ex = exerciseById[id];
              if (!ex) return null;
              return (
                <div key={id} className="bg-neutral-900 pixel-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-neutral-400 text-sm">{ex.name}</p>
                    <p className="text-neutral-700 text-xs mt-0.5">{ex.primary.join(", ")}</p>
                  </div>
                  <button
                    onClick={() => onToggleDislike(id)}
                    className="px-3 py-1.5 text-sm border border-orange-700 bg-orange-950 text-orange-400 hover:bg-orange-900 transition-colors"
                    title="Remove from excluded"
                  >
                    👎
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
