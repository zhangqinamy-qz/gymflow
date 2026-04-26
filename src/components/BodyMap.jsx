const ACCENT = "#CCFF47";
const MUTED  = "#6ea825";

const MUSCLE_PATHS = {
  Chest: {
    d: "M78 82 Q90 78 102 82 Q106 95 102 105 Q90 110 78 105 Q74 95 78 82Z",
  },
  Shoulders: {
    dLeft:  "M60 78 Q70 70 78 82 Q74 95 66 98 Q56 90 58 80Z",
    dRight: "M120 78 Q110 70 102 82 Q106 95 114 98 Q124 90 122 80Z",
  },
  Biceps: {
    dLeft:  "M58 100 Q52 110 54 124 Q62 126 66 120 Q68 108 66 98Z",
    dRight: "M122 100 Q128 110 126 124 Q118 126 114 120 Q112 108 114 98Z",
  },
  Forearms: {
    dLeft:  "M54 126 Q50 140 52 154 Q58 156 64 152 Q66 138 66 120 Q62 126 54 126Z",
    dRight: "M126 126 Q130 140 128 154 Q122 156 116 152 Q114 138 114 120 Q118 126 126 126Z",
  },
  Core: {
    d: "M80 108 Q90 106 100 108 Q102 130 100 150 Q90 152 80 150 Q78 130 80 108Z",
  },
  "Hip Flexors": {
    d: "M80 150 Q86 148 90 150 Q92 162 88 170 Q84 170 80 168 Q78 160 80 150Z M90 150 Q94 148 100 150 Q102 162 100 168 Q96 170 92 170 Q88 162 90 150Z",
  },
  Quads: {
    d: "M76 170 Q82 168 88 172 Q90 195 88 215 Q82 218 76 215 Q72 195 76 170Z M92 172 Q98 168 104 170 Q108 195 104 215 Q98 218 92 215 Q90 195 92 172Z",
  },
  Calves: {
    d: "M76 218 Q80 216 86 218 Q88 235 84 248 Q80 250 76 248 Q72 235 76 218Z M94 218 Q98 216 104 218 Q108 235 104 248 Q100 250 96 248 Q92 235 94 218Z",
  },
  Back: {
    d: "M78 82 Q90 78 102 82 Q106 108 100 130 Q90 134 80 130 Q74 108 78 82Z",
  },
  Triceps: {
    dLeft:  "M58 100 Q52 112 54 126 Q62 128 66 122 Q68 110 66 98Z",
    dRight: "M122 100 Q128 112 126 126 Q118 128 114 122 Q112 110 114 98Z",
  },
  Glutes: {
    d: "M78 150 Q90 146 102 150 Q106 168 100 180 Q90 184 80 180 Q74 168 78 150Z",
  },
  Hamstrings: {
    d: "M76 182 Q82 180 88 184 Q88 204 84 218 Q80 220 76 218 Q72 204 76 182Z M92 184 Q98 180 104 182 Q108 204 104 218 Q100 220 96 218 Q92 204 92 184Z",
  },
};


const FRONT_MUSCLES = ["Chest","Shoulders","Biceps","Forearms","Core","Hip Flexors","Quads","Calves"];
const BACK_MUSCLES  = ["Back","Shoulders","Triceps","Forearms","Glutes","Hamstrings","Calves"];

const FULL_YMIN = 14;
const FULL_YMAX = 270;

// Clean body silhouette drawn as individual body-part shapes
function Silhouette() {
  return (
    <g fill="#252525" stroke="#363636" strokeWidth="0.8" strokeLinejoin="round">
      {/* Head */}
      <ellipse cx="90" cy="34" rx="14" ry="17" />
      {/* Neck */}
      <path d="M86 50 L94 50 L94 63 L86 63Z" />
      {/* Torso — solid trapezoid, shoulders to waist */}
      <path d="M68 61 Q90 57 112 61 L107 138 Q90 142 73 138Z" />
      {/* Hips / pelvis */}
      <path d="M73 138 Q90 142 107 138 L109 160 Q90 164 71 160Z" />
      {/* Left upper arm */}
      <path d="M68 61 L62 66 L56 102 L65 105 L70 68Z" />
      {/* Right upper arm */}
      <path d="M112 61 L118 66 L124 102 L115 105 L110 68Z" />
      {/* Left forearm */}
      <path d="M56 102 L51 150 L60 152 L65 105Z" />
      {/* Right forearm */}
      <path d="M124 102 L129 150 L120 152 L115 105Z" />
      {/* Left thigh */}
      <path d="M71 160 L85 160 L83 220 L67 220Z" />
      {/* Right thigh */}
      <path d="M95 160 L109 160 L113 220 L99 220Z" />
      {/* Left calf */}
      <path d="M67 220 L83 220 L81 257 L69 259Z" />
      {/* Right calf */}
      <path d="M99 220 L113 220 L111 259 L101 257Z" />
    </g>
  );
}

function renderMuscle(name, path, isPrimary) {
  const fill    = isPrimary ? ACCENT : MUTED;
  const opacity = isPrimary ? 0.9 : 0.5;
  if (path.dLeft) {
    return (
      <g key={name}>
        <path d={path.dLeft}  fill={fill} opacity={opacity} />
        <path d={path.dRight} fill={fill} opacity={opacity} />
      </g>
    );
  }
  return <path key={name} d={path.d} fill={fill} opacity={opacity} />;
}

function BodyView({ label, muscleNames, primary, secondary, yMin, yMax, wide }) {
  const active = muscleNames.filter((name) => primary.includes(name) || secondary.includes(name));
  if (active.length === 0) return null;

  const width = wide ? 120 : 88;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-display text-neutral-700" style={{ fontSize: "6px", letterSpacing: "0.1em" }}>
        {label}
      </span>
      <svg viewBox={`40 ${yMin} 100 ${yMax - yMin}`} style={{ width, display: "block" }}>
        <Silhouette />
        {active.map((name) => {
          const path = MUSCLE_PATHS[name];
          if (!path) return null;
          return renderMuscle(name, path, primary.includes(name));
        })}
      </svg>
    </div>
  );
}

export default function BodyMap({ primary = [], secondary = [] }) {
  const yMin = FULL_YMIN;
  const yMax = FULL_YMAX;
  const wide = false;

  return (
    <div className="flex gap-4 justify-center items-end">
      <BodyView
        label="FRONT"
        muscleNames={FRONT_MUSCLES}
        primary={primary}
        secondary={secondary}
        yMin={yMin} yMax={yMax}
        wide={wide}
      />
      <BodyView
        label="BACK"
        muscleNames={BACK_MUSCLES}
        primary={primary}
        secondary={secondary}
        yMin={yMin} yMax={yMax}
        wide={wide}
      />
      <div className="flex flex-col justify-center gap-2 text-xs self-center ml-1">
        {primary.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 flex-shrink-0" style={{ background: ACCENT }} />
            <span className="text-neutral-500">Primary</span>
          </div>
        )}
        {secondary.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 flex-shrink-0" style={{ background: MUTED }} />
            <span className="text-neutral-500">Secondary</span>
          </div>
        )}
      </div>
    </div>
  );
}
