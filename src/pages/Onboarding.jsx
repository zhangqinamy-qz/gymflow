import { useState } from "react";
import { EQUIPMENT } from "../data/exercises";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const ALL_EQUIPMENT = Object.values(EQUIPMENT);

const levelDesc = {
  Beginner:     "New to working out, or returning after a long break",
  Intermediate: "Training consistently for 6+ months",
  Advanced:     "1+ years of consistent training",
};

export default function Onboarding({ onComplete, onCancel }) {
  const [step, setStep]   = useState(0);
  const [name, setName]   = useState("");
  const [level, setLevel] = useState("Beginner");
  const [gear, setGear]   = useState(["Bodyweight"]);

  const toggleGear = (item) =>
    setGear((g) => g.includes(item) ? g.filter((x) => x !== item) : [...g, item]);

  const finish = () => onComplete({ name: name.trim() || "Athlete", level, equipment: gear });

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="font-display" style={{ color: "#CCFF47", fontSize: "14px", letterSpacing: "0.3em", lineHeight: "2" }}>
            GYMFLOW
          </h1>
          <p className="text-neutral-600 text-sm mt-1">
            {onCancel ? "Add a new profile" : "Your personal workout guide"}
          </p>
        </div>

        {/* Step 0: Name */}
        {step === 0 && (
          <div>
            <h2 className="font-display text-xs text-white mb-5" style={{ lineHeight: "1.8" }}>
              WHAT'S YOUR<br />NAME?
            </h2>
            <input
              type="text"
              placeholder="e.g. Amy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(1)}
              autoFocus
              className="w-full bg-neutral-900 border border-neutral-700 text-white text-lg px-4 py-4 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 mb-4 pixel-card"
            />
            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="w-full py-4 font-semibold text-neutral-950 disabled:opacity-40 pixel-btn transition-all"
              style={{ background: "#CCFF47" }}
            >
              Next →
            </button>
            {onCancel && (
              <button onClick={onCancel} className="w-full py-3 mt-2 text-sm text-neutral-600 hover:text-neutral-400 transition-colors">
                Cancel
              </button>
            )}
          </div>
        )}

        {/* Step 1: Level */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-xs text-white mb-5" style={{ lineHeight: "1.8" }}>
              EXPERIENCE<br />LEVEL?
            </h2>
            <div className="flex flex-col gap-3 mb-6">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`w-full py-4 px-5 text-left font-medium text-sm transition-all border ${
                    level === l ? "pixel-selected" : "border-neutral-700 text-neutral-300 hover:border-neutral-500 pixel-btn-ghost"
                  }`}
                >
                  {l}
                  <span className="block text-xs font-normal mt-1 opacity-60">{levelDesc[l]}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-4 border border-neutral-700 text-neutral-300 text-sm font-medium pixel-btn-ghost">
                ← Back
              </button>
              <button onClick={() => setStep(2)} className="flex-1 py-4 font-semibold text-neutral-950 pixel-btn" style={{ background: "#CCFF47" }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Equipment */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-xs text-white mb-2" style={{ lineHeight: "1.8" }}>
              AVAILABLE<br />EQUIPMENT?
            </h2>
            <p className="text-neutral-600 text-xs mb-5">Select everything you have access to.</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {ALL_EQUIPMENT.map((item) => (
                <button
                  key={item}
                  onClick={() => toggleGear(item)}
                  className={`py-3 px-3 text-sm font-medium text-left transition-all border ${
                    gear.includes(item) ? "pixel-selected" : "border-neutral-700 text-neutral-400 hover:border-neutral-500 pixel-btn-ghost"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-4 border border-neutral-700 text-neutral-300 text-sm font-medium pixel-btn-ghost">
                ← Back
              </button>
              <button
                onClick={finish}
                disabled={gear.length === 0}
                className="flex-1 py-4 font-semibold text-neutral-950 disabled:opacity-40 pixel-btn"
                style={{ background: "#CCFF47" }}
              >
                Let's go!
              </button>
            </div>
          </div>
        )}

        {/* Step dots */}
        <div className="flex gap-2 justify-center mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1 transition-all"
              style={{
                width: i === step ? 24 : 10,
                background: i === step ? "#CCFF47" : "#333",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
