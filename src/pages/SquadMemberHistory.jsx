import { useParams, useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/workouts";

const catTag = {
  [CATEGORIES.RUNNING]:  "text-orange-400 border-orange-900 bg-orange-950",
  [CATEGORIES.BALL]:     "text-sky-400 border-sky-900 bg-sky-950",
  [CATEGORIES.STRENGTH]: "text-lime-400 border-lime-900 bg-lime-950",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function SquadMemberHistory({ squadHistory = {} }) {
  const { memberName } = useParams();
  const navigate = useNavigate();

  // squadHistory keys preserve original casing; find case-insensitively
  const key = Object.keys(squadHistory).find((k) => k.toLowerCase() === memberName.toLowerCase());
  const sessions = key ? squadHistory[key] : [];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
      <button
        onClick={() => navigate("/")}
        className="text-neutral-600 hover:text-neutral-400 text-sm transition-colors mb-5"
      >
        ← Back
      </button>

      <div className="mb-6">
        <p className="font-display mb-1" style={{ color: "var(--accent)", fontSize: "18px" }}>★</p>
        <h1 className="font-display text-white mb-0.5" style={{ fontSize: "14px", letterSpacing: "0.15em" }}>
          {key || memberName}
        </h1>
        <p className="text-neutral-500 text-xs">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
      </div>

      {sessions.length === 0 ? (
        <p className="text-neutral-600 text-sm">No sessions logged yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((log, i) => (
            <div key={i} className="bg-neutral-900 pixel-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium">{log.title || "Workout"}</p>
                    <span style={{ color: "var(--accent)", fontSize: "10px", letterSpacing: "1px" }}>
                      {"★".repeat(log.stars || 1)}
                    </span>
                  </div>
                  <p className="text-neutral-600 text-xs mt-0.5">{formatDate(log.date)}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {log.duration  > 0 && <span className="text-neutral-500 text-xs">{log.duration} min</span>}
                    {log.calories      && <span className="text-orange-400 text-xs">{log.calories} cal</span>}
                    {log.distance      && <span className="text-sky-400 text-xs">{log.distance} {log.distanceUnit}</span>}
                    {log.heartRate     && <span className="text-red-400 text-xs">♥ {log.heartRate} bpm</span>}
                  </div>
                </div>
                {log.category && (
                  <span className={`font-display px-2 py-0.5 border flex-shrink-0 ml-3 ${catTag[log.category] || "text-neutral-400 border-neutral-700 bg-neutral-800"}`} style={{ fontSize: "6px" }}>
                    {log.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
