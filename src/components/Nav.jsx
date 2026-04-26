import { NavLink } from "react-router-dom";

const links = [
  {
    to: "/", label: "Home", end: true,
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="square" strokeLinejoin="miter" d="M3 12l9-9 9 9M5 10v9h5v-5h4v5h5v-9" />
      </svg>
    ),
  },
  {
    to: "/browse", label: "Browse", end: false,
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <rect x="3" y="3" width="8" height="8" strokeLinejoin="miter" />
        <rect x="13" y="3" width="8" height="8" strokeLinejoin="miter" />
        <rect x="3" y="13" width="8" height="8" strokeLinejoin="miter" />
        <rect x="13" y="13" width="8" height="8" strokeLinejoin="miter" />
      </svg>
    ),
  },
  {
    to: "/create", label: "Create", end: false,
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" strokeLinejoin="miter" />
        <path strokeLinecap="square" d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    to: "/history", label: "Log", end: false,
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <rect x="4" y="3" width="16" height="18" strokeLinejoin="miter" />
        <path strokeLinecap="square" d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
];

function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === "light";
  return (
    <button
      onClick={onToggle}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="flex flex-col items-center gap-1 text-neutral-600 hover:text-neutral-400 transition-colors"
    >
      {isLight ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="square" strokeLinejoin="miter" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <circle cx="12" cy="12" r="5" strokeLinejoin="miter" />
          <path strokeLinecap="square" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      )}
      <span className="font-display" style={{ fontSize: "6px", letterSpacing: "0.08em" }}>
        {isLight ? "DARK" : "LIGHT"}
      </span>
    </button>
  );
}

export default function Nav({ theme = "dark", onToggleTheme }) {
  return (
    <>
      {/* Mobile bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950 border-t-2 border-neutral-800 flex md:hidden z-50">
        {links.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${
                isActive ? "text-lime-400" : "text-neutral-600 hover:text-neutral-400"
              }`
            }
          >
            {({ isActive }) => <>{icon(isActive)}<span className="font-display" style={{ fontSize: "6px", letterSpacing: "0.1em" }}>{label}</span></>}
          </NavLink>
        ))}
        <div className="flex-1 flex flex-col items-center py-3 gap-1">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </nav>

      {/* Desktop side */}
      <nav className="fixed top-0 left-0 h-full w-20 bg-neutral-950 border-r-2 border-neutral-800 hidden md:flex flex-col items-center py-8 gap-8 z-50">
        <div className="font-display text-center mb-2" style={{ color: "#CCFF47", fontSize: "7px", letterSpacing: "0.2em", lineHeight: "2", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
          GYMFLOW
        </div>
        {links.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive ? "text-lime-400" : "text-neutral-600 hover:text-neutral-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {icon(isActive)}
                <span className="font-display" style={{ fontSize: "6px", letterSpacing: "0.08em" }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <div className="mt-auto">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </nav>
    </>
  );
}
