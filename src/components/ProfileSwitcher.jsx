import { useState } from "react";

export default function ProfileSwitcher({ profiles, activeId, onSwitch, onAddProfile, onDeleteProfile, onClose }) {
  const [confirmDelete, setConfirmDelete] = useState(null); // profile id pending delete

  const handleDelete = (id) => {
    onDeleteProfile(id);
    setConfirmDelete(null);
    // If we deleted the active profile and others remain, close; otherwise onboarding takes over
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-700 pixel-card p-6 mx-4 mb-4 md:mb-0">
        <h2 className="font-display mb-5" style={{ color: "#CCFF47", fontSize: "9px", letterSpacing: "0.12em" }}>
          WHO'S WORKING OUT?
        </h2>

        <div className="flex flex-col gap-2 mb-4">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-stretch gap-2">
              {/* Profile select button */}
              <button
                onClick={() => { onSwitch(p.id); onClose(); }}
                className={`flex-1 text-left px-4 py-3 border font-medium text-sm transition-all ${
                  p.id === activeId
                    ? "pixel-selected"
                    : "border-neutral-700 text-neutral-300 hover:border-neutral-500 pixel-btn-ghost"
                }`}
              >
                <span className="block">{p.name}</span>
                <span className="text-xs text-neutral-500 font-normal">{p.level}</span>
              </button>

              {/* Delete button */}
              {confirmDelete === p.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-3 text-xs font-display border border-red-700 bg-red-950 text-red-400 hover:bg-red-900 transition-colors"
                    style={{ fontSize: "7px" }}
                  >
                    DEL
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 text-xs border border-neutral-700 text-neutral-500 hover:border-neutral-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(p.id)}
                  className="px-3 border border-neutral-800 text-neutral-700 hover:border-red-800 hover:text-red-500 transition-colors text-xs"
                  title="Delete profile"
                >
                  🗑
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => { onAddProfile(); onClose(); }}
          className="w-full py-3 text-sm font-medium border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 pixel-btn-ghost transition-colors"
        >
          + Add Profile
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 mt-2 text-sm text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
