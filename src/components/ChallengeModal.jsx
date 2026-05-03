import { useState } from "react";
import { workouts as presetWorkouts, CATEGORIES } from "../data/workouts";

const FILTERS = ["All", CATEGORIES.RUNNING, CATEGORIES.STRENGTH, CATEGORIES.BALL];
const FILTER_LABELS = { All: "ALL", [CATEGORIES.RUNNING]: "CARDIO", [CATEGORIES.STRENGTH]: "STRENGTH", [CATEGORIES.BALL]: "BALL" };

export default function ChallengeModal({ toName, customWorkouts = [], onSend, onClose }) {
  const [selectedId, setSelectedId] = useState(null);
  const [message,    setMessage]    = useState("");
  const [filter,     setFilter]     = useState("All");
  const [sending,    setSending]    = useState(false);

  const allWorkouts = [...presetWorkouts, ...customWorkouts];
  const filtered    = allWorkouts.filter((w) => filter === "All" || w.category === filter);
  const selected    = allWorkouts.find((w) => w.id === selectedId);

  const handleSend = async () => {
    if (!selected || sending) return;
    setSending(true);
    await onSend(selected.title, selected.id, message.trim() || null);
    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-700 pixel-card mx-4 mb-4 md:mb-0 max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-neutral-800">
          <p className="font-display" style={{ color: "var(--accent)", fontSize: "7px", letterSpacing: "0.15em" }}>
            SEND CHALLENGE ⚡
          </p>
          <p className="text-white text-sm font-medium mt-1">→ {toName}</p>
        </div>

        {/* Category filter */}
        <div className="px-5 pt-3 flex gap-1.5 flex-wrap">
          {FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="font-display px-2.5 py-1 border transition-colors"
              style={{
                fontSize: "6px", letterSpacing: "0.1em",
                color: filter === cat ? "var(--accent)" : "#555",
                borderColor: filter === cat ? "var(--accent)" : "#333",
                background: filter === cat ? "var(--accent)12" : "transparent",
              }}
            >
              {FILTER_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Workout list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-1.5">
          {filtered.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedId(w.id === selectedId ? null : w.id)}
              className={`w-full text-left px-3 py-2.5 border transition-colors ${
                selectedId === w.id
                  ? "border-[var(--accent)] bg-[var(--accent)]/5"
                  : "border-neutral-800 hover:border-neutral-600"
              }`}
            >
              <p className="text-white text-sm">{w.title}</p>
              <p className="text-neutral-600 mt-0.5" style={{ fontSize: "11px" }}>
                {w.subcategory || w.category} · {w.difficulty} · {w.duration}m
              </p>
            </button>
          ))}
        </div>

        {/* Message + actions */}
        <div className="px-5 pb-5 pt-4 border-t border-neutral-800">
          <input
            type="text"
            placeholder="Add a message... (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={100}
            className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 py-2 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-neutral-500 border border-neutral-800 hover:border-neutral-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!selected || sending}
              className="flex-1 py-2.5 font-display text-neutral-950 pixel-btn disabled:opacity-40 transition-opacity"
              style={{ background: "var(--accent)", fontSize: "8px", letterSpacing: "0.1em" }}
            >
              {sending ? "SENDING..." : "SEND ⚡"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
