import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { workouts, CATEGORIES } from "../data/workouts";
import ProfileSwitcher from "../components/ProfileSwitcher";
import ChallengeModal from "../components/ChallengeModal";
import { DIVERSITY_ORDER, DIVERSITY_LABELS } from "../lib/diversityUtils";

function SquadSection({ profile, activeId, squadLeaderboard, squadHistory = {}, squadChallenges = [], onCreateSquad, onJoinSquad, onLeaveSquad, onSendChallenge, customWorkouts = [] }) {
  const navigate = useNavigate();
  const [joinCode,        setJoinCode]        = useState("");
  const [joining,         setJoining]         = useState(false);
  const [creating,        setCreating]        = useState(false);
  const [error,           setError]           = useState("");
  const [copied,          setCopied]          = useState(false);
  const [challengingName, setChallengingName] = useState(null);

  const badgeCounts = {};
  squadChallenges.filter((c) => c.completed).forEach((c) => {
    const from = c.from_name.toLowerCase();
    const to   = c.to_name.toLowerCase();
    if (!badgeCounts[from]) badgeCounts[from] = { coached: 0, completed: 0 };
    if (!badgeCounts[to])   badgeCounts[to]   = { coached: 0, completed: 0 };
    badgeCounts[from].coached++;
    badgeCounts[to].completed++;
  });

  const inSquad = !!profile?.squadId;

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setError("");
    try { await onJoinSquad(joinCode); setJoinCode(""); }
    catch (e) { setError(e.message); }
    finally { setJoining(false); }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try { await onCreateSquad(); }
    catch (e) { setError(e.message || "Failed to create squad"); }
    finally { setCreating(false); }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(profile.squadId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inSquad) {
    return (
      <div className="mb-8">
        <h2 className="font-display text-white mb-3" style={{ fontSize: "9px", letterSpacing: "0.12em" }}>SQUAD</h2>
        <div className="bg-neutral-900 pixel-card p-4">
          <p className="text-neutral-500 text-sm mb-4">Compete with friends on a shared leaderboard.</p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Enter squad code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="flex-1 bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              maxLength={8}
            />
            <button
              onClick={handleJoin}
              disabled={joining || !joinCode.trim()}
              className="px-4 py-2 font-display text-neutral-950 pixel-btn disabled:opacity-40"
              style={{ background: "var(--accent)", fontSize: "8px", letterSpacing: "0.1em" }}
            >
              {joining ? "..." : "JOIN"}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <div className="flex items-center gap-3 my-3">
            <div className="h-px flex-1 bg-neutral-800" />
            <span className="text-neutral-700 text-xs">or</span>
            <div className="h-px flex-1 bg-neutral-800" />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-2.5 font-display text-neutral-500 border border-neutral-700 hover:border-neutral-500 hover:text-neutral-300 transition-colors disabled:opacity-40"
            style={{ fontSize: "7px", letterSpacing: "0.12em" }}
          >
            {creating ? "CREATING..." : "+ CREATE NEW SQUAD"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-white" style={{ fontSize: "9px", letterSpacing: "0.12em" }}>SQUAD</h2>
        <button
          onClick={onLeaveSquad}
          className="font-display text-neutral-700 hover:text-red-500 transition-colors"
          style={{ fontSize: "6px", letterSpacing: "0.1em" }}
        >
          LEAVE
        </button>
      </div>

      <div className="bg-neutral-900 pixel-card p-4 mb-3 flex items-center justify-between">
        <div>
          <p className="font-display text-neutral-600" style={{ fontSize: "6px", letterSpacing: "0.12em" }}>SQUAD CODE — share with friends</p>
          <p className="font-display text-white mt-1" style={{ fontSize: "22px", letterSpacing: "0.3em" }}>{profile.squadId}</p>
        </div>
        <button
          onClick={copyCode}
          className="font-display px-3 py-1.5 border border-neutral-700 text-neutral-400 hover:border-neutral-500 transition-colors"
          style={{ fontSize: "6px", letterSpacing: "0.1em" }}
        >
          {copied ? "COPIED!" : "COPY"}
        </button>
      </div>

      {squadLeaderboard.length > 0 ? (
        <div className="bg-neutral-900 pixel-card overflow-hidden">
          {squadLeaderboard.map((m, i) => {
            const isMe      = m.name.toLowerCase() === profile?.name?.toLowerCase();
            const rankColor = RANK_COLORS[i] || "#555";
            const badges    = badgeCounts[m.name.toLowerCase()];
            return (
              <div
                key={m.name}
                className={`flex items-center gap-2 px-4 py-3 border-b border-neutral-800 last:border-b-0 ${isMe ? "bg-neutral-800/60" : ""}`}
              >
                <button
                  className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/squad/${encodeURIComponent(m.name)}`)}
                >
                  <span className="font-display w-6 flex-shrink-0" style={{ fontSize: "8px", color: rankColor }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center border" style={{ borderColor: rankColor, background: `${rankColor}18` }}>
                    <span className="font-display" style={{ fontSize: "7px", color: rankColor }}>{m.name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-white text-sm font-medium truncate">
                        {m.name}{isMe && <span className="text-neutral-600 text-xs ml-1">(you)</span>}
                      </p>
                      {badges?.coached > 0 && (
                        <span className="font-display" style={{ fontSize: "6px", color: "#f59e0b" }} title="Challenges helped">🏋️ {badges.coached}</span>
                      )}
                      {badges?.completed > 0 && (
                        <span className="font-display" style={{ fontSize: "6px", color: "var(--accent)" }} title="Challenges completed">⚡ {badges.completed}</span>
                      )}
                    </div>
                    <p className="text-neutral-600 text-xs">{m.sessions} session{m.sessions !== 1 ? "s" : ""}</p>
                    <div className="flex gap-1 mt-1.5">
                      {DIVERSITY_ORDER.map((cat) => {
                        const lit = m.hitCategories?.includes(cat);
                        return (
                          <span
                            key={cat}
                            className="font-display"
                            style={{
                              fontSize: "5px",
                              letterSpacing: "0.04em",
                              padding: "1px 3px",
                              color: lit ? "var(--accent)" : "#444",
                              border: `1px solid ${lit ? "var(--accent)" : "#333"}`,
                            }}
                          >
                            {DIVERSITY_LABELS[cat]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>
                <div className="flex-shrink-0 text-right">
                  <p className="font-display" style={{ color: rankColor, fontSize: "14px" }}>{m.weeklyScore || 0}</p>
                  <p className="text-neutral-600" style={{ fontSize: "9px" }}>WK SCORE</p>
                </div>
                {!isMe && onSendChallenge && (
                  <button
                    onClick={() => setChallengingName(m.name)}
                    className="flex-shrink-0 w-8 border border-neutral-800 text-neutral-600 hover:border-yellow-700 hover:text-yellow-500 transition-colors text-xs self-stretch flex items-center justify-center"
                    title="Send challenge"
                  >
                    ⚡
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-neutral-600 text-sm text-center py-3">
          No sessions yet — log a workout to appear here!
        </p>
      )}

      {challengingName && (
        <ChallengeModal
          toName={challengingName}
          customWorkouts={customWorkouts}
          onSend={async (title, id, msg) => { await onSendChallenge(challengingName, title, id, msg); }}
          onClose={() => setChallengingName(null)}
        />
      )}
    </div>
  );
}

const catColor = {
  [CATEGORIES.RUNNING]:  "text-orange-400",
  [CATEGORIES.BALL]:     "text-sky-400",
  [CATEGORIES.STRENGTH]: "text-lime-400",
};

const RANK_COLORS = ["var(--accent)", "#aaaaaa", "#cd7f32"];
const RANK_LABELS = ["01", "02", "03", "04", "05"];

function Stars({ count, size = "sm" }) {
  const px = size === "lg" ? "14px" : "10px";
  return (
    <span style={{ color: "var(--accent)", fontSize: px, letterSpacing: "2px" }}>
      {"★".repeat(count)}{"☆".repeat(3 - count)}
    </span>
  );
}

function WorkoutCard({ workout }) {
  return (
    <Link
      to={`/workout/${workout.id}`}
      className="block bg-neutral-900 pixel-card p-4 hover:bg-neutral-800 transition-colors active:scale-95"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <span className={`text-xs uppercase tracking-wider font-display ${catColor[workout.category] || "text-neutral-400"}`} style={{ fontSize: "7px" }}>
            {workout.subcategory || workout.category}
          </span>
          <h3 className="text-white font-semibold text-base mt-1">{workout.title}</h3>
        </div>
        <span className="text-neutral-500 text-xs ml-2 flex-shrink-0">{workout.duration}m</span>
      </div>
      <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2">{workout.description}</p>
      <div className="flex gap-2 mt-3">
        <span className="text-xs px-2 py-0.5 bg-neutral-800 text-neutral-500 border border-neutral-700">{workout.difficulty}</span>
      </div>
    </Link>
  );
}

export default function Home({ profile, profiles, activeId, history, leaderboard = [], onSwitch, onAddProfile, onDeleteProfile, onUpdateProfile, squadLeaderboard = [], squadHistory = {}, squadChallenges = [], onSendChallenge, onCompleteChallenge, customWorkouts = [], supabaseEnabled = false, onCreateSquad, onJoinSquad, onLeaveSquad }) {
  const [showSwitcher, setShowSwitcher] = useState(false);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const sessionsThisWeek = history.filter((h) => new Date(h.date) >= weekStart).length;
  const totalStars = history.reduce((sum, h) => sum + (h.stars || 1), 0);

  const greet = () => {
    const h = today.getHours();
    if (h < 12) return "GOOD MORNING";
    if (h < 17) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  // Smart recommendations: avoid focus areas done this week, prefer matching level
  const thisWeek = history.filter((h) => new Date(h.date) >= weekStart);
  const focusArea = (w) => w.subcategory || w.category;

  const doneFocus = {};
  thisWeek.forEach((log) => {
    const matched = workouts.find((w) => w.title === log.title);
    if (!matched) return;
    const fa = focusArea(matched);
    const d = new Date(log.date);
    if (!doneFocus[fa] || d > doneFocus[fa]) doneFocus[fa] = d;
  });

  const scored = workouts
    .filter((w) => w.category !== CATEGORIES.BALL)
    .map((w) => {
      const fa = focusArea(w);
      const last = doneFocus[fa];
      let score = last
        ? (Date.now() - last) / (1000 * 60 * 60 * 24)
        : 100;
      if (w.difficulty === profile?.level) score += 5;
      return { w, fa, score };
    })
    .sort((a, b) => b.score - a.score);

  const featured = [];
  const usedFocus = new Set();
  for (const { w, fa } of scored) {
    if (usedFocus.has(fa)) continue;
    featured.push(w);
    usedFocus.add(fa);
    if (featured.length === 3) break;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-6">
      {showSwitcher && (
        <ProfileSwitcher
          profiles={profiles}
          activeId={activeId}
          onSwitch={onSwitch}
          onAddProfile={onAddProfile}
          onDeleteProfile={onDeleteProfile}
          onUpdateProfile={onUpdateProfile}
          onClose={() => setShowSwitcher(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-neutral-600 font-display" style={{ fontSize: "7px", letterSpacing: "0.15em" }}>{greet()}</p>
          <h1 className="font-display mt-2" style={{ color: "var(--accent)", fontSize: "22px", letterSpacing: "0.2em", lineHeight: "1.4" }}>
            GYMBUDDY
          </h1>
        </div>
        <button
          onClick={() => setShowSwitcher(true)}
          className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 px-3 py-2 pixel-card hover:border-neutral-500 transition-colors"
        >
          <div className="w-5 h-5 bg-lime-400/20 border border-lime-400/40 flex items-center justify-center">
            <span className="text-lime-400 font-display" style={{ fontSize: "6px" }}>
              {profile?.name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <span className="text-white text-xs font-medium">{profile?.name || "Select"}</span>
          <span className="text-neutral-600 text-xs">▾</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Link to="/history" className="bg-neutral-900 pixel-card p-4 hover:bg-neutral-800 transition-colors">
          <p className="font-display text-neutral-600" style={{ fontSize: "6px", letterSpacing: "0.1em" }}>THIS WEEK</p>
          <p className="font-display mt-2 mb-0.5" style={{ color: "var(--accent)", fontSize: "24px" }}>{sessionsThisWeek}</p>
          <p className="text-neutral-600 text-xs">sessions</p>
        </Link>
        <Link to="/history" className="bg-neutral-900 pixel-card p-4 hover:bg-neutral-800 transition-colors">
          <p className="font-display text-neutral-600" style={{ fontSize: "6px", letterSpacing: "0.1em" }}>ALL TIME</p>
          <p className="font-display mt-2 mb-0.5" style={{ color: "var(--accent)", fontSize: "24px" }}>{history.length}</p>
          <p className="text-neutral-600 text-xs">sessions</p>
        </Link>
        <Link to="/history" className="bg-neutral-900 pixel-card p-4 hover:bg-neutral-800 transition-colors">
          <p className="font-display text-neutral-600" style={{ fontSize: "6px", letterSpacing: "0.1em" }}>MY STARS</p>
          <p className="font-display mt-2 mb-0.5" style={{ color: "var(--accent)", fontSize: "24px" }}>{totalStars}</p>
          <p className="text-neutral-600 text-xs">★ earned</p>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Link
          to="/browse"
          className="flex items-center justify-center gap-2 py-3 bg-neutral-900 border border-neutral-700 pixel-card hover:border-neutral-500 transition-colors"
        >
          <span className="font-display text-neutral-400" style={{ fontSize: "8px", letterSpacing: "0.12em" }}>BROWSE</span>
        </Link>
        <Link
          to="/create"
          className="flex items-center justify-center gap-2 py-3 pixel-btn font-display text-neutral-950 transition-colors"
          style={{ background: "var(--accent)", fontSize: "8px", letterSpacing: "0.12em" }}
        >
          + CREATE
        </Link>
      </div>
      <Link
        to="/log"
        className="flex items-center justify-center py-3 mb-8 bg-neutral-900 border border-neutral-700 pixel-card hover:border-neutral-500 transition-colors"
      >
        <span className="font-display text-neutral-400" style={{ fontSize: "8px", letterSpacing: "0.12em" }}>✎ LOG PAST WORKOUT</span>
      </Link>

      {/* Challenges inbox */}
      {squadChallenges.filter((c) => c.to_name.toLowerCase() === profile?.name?.toLowerCase() && !c.completed).length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-white mb-3" style={{ fontSize: "9px", letterSpacing: "0.12em" }}>CHALLENGES ⚡</h2>
          <div className="flex flex-col gap-2">
            {squadChallenges
              .filter((c) => c.to_name.toLowerCase() === profile?.name?.toLowerCase() && !c.completed)
              .map((c) => (
                <div key={c.id} className="bg-neutral-900 pixel-card p-4">
                  <p className="font-display mb-1" style={{ fontSize: "6px", letterSpacing: "0.12em", color: "#f59e0b" }}>
                    FROM {c.from_name.toUpperCase()}
                  </p>
                  <p className="text-white font-medium text-sm">{c.workout_title}</p>
                  {c.message && <p className="text-neutral-500 text-xs mt-1">"{c.message}"</p>}
                  <div className="flex gap-2 mt-3">
                    {c.workout_id && (
                      <Link
                        to={`/workout/${c.workout_id}`}
                        className="flex-1 py-2 text-center font-display text-neutral-950 pixel-btn"
                        style={{ background: "var(--accent)", fontSize: "7px", letterSpacing: "0.1em" }}
                      >
                        START
                      </Link>
                    )}
                    <button
                      onClick={() => onCompleteChallenge(c.id)}
                      className="flex-1 py-2 font-display border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
                      style={{ fontSize: "7px", letterSpacing: "0.1em" }}
                    >
                      MARK DONE ✓
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Squad */}
      <SquadSection
        profile={profile}
        activeId={activeId}
        squadLeaderboard={squadLeaderboard}
        squadHistory={squadHistory}
        squadChallenges={squadChallenges}
        onSendChallenge={onSendChallenge}
        customWorkouts={customWorkouts}
        onCreateSquad={onCreateSquad}
        onJoinSquad={onJoinSquad}
        onLeaveSquad={onLeaveSquad}
      />

      {/* Leaderboard */}
      {leaderboard.length > 1 && !profile?.squadId && (
        <div className="mb-8">
          <h2 className="font-display text-white mb-3" style={{ fontSize: "9px", letterSpacing: "0.12em" }}>
            LEADERBOARD
          </h2>
          <div className="bg-neutral-900 pixel-card overflow-hidden">
            {leaderboard.map((p, i) => {
              const isActive = p.id === activeId;
              const rankColor = RANK_COLORS[i] || "#555";
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-neutral-800 last:border-b-0 ${isActive ? "bg-neutral-800/60" : ""}`}
                >
                  {/* Rank */}
                  <span className="font-display w-6 flex-shrink-0" style={{ fontSize: "8px", color: rankColor }}>
                    {RANK_LABELS[i]}
                  </span>

                  {/* Avatar */}
                  <div
                    className="w-7 h-7 flex-shrink-0 flex items-center justify-center border"
                    style={{ borderColor: rankColor, background: `${rankColor}18` }}
                  >
                    <span className="font-display" style={{ fontSize: "7px", color: rankColor }}>
                      {p.name[0]?.toUpperCase()}
                    </span>
                  </div>

                  {/* Name + sessions + diversity badge */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {p.name}
                      {isActive && <span className="text-neutral-600 text-xs ml-1">(you)</span>}
                    </p>
                    <p className="text-neutral-600 text-xs">{p.sessions} session{p.sessions !== 1 ? "s" : ""}</p>
                    <div className="flex gap-1 mt-1.5">
                      {DIVERSITY_ORDER.map((cat) => {
                        const lit = p.hitCategories?.includes(cat);
                        return (
                          <span
                            key={cat}
                            className="font-display"
                            style={{
                              fontSize: "5px",
                              letterSpacing: "0.04em",
                              padding: "1px 3px",
                              color: lit ? "var(--accent)" : "#444",
                              border: `1px solid ${lit ? "var(--accent)" : "#333"}`,
                            }}
                          >
                            {DIVERSITY_LABELS[cat]}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weekly score */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-display" style={{ color: rankColor, fontSize: "14px" }}>
                      {p.weeklyScore || 0}
                    </p>
                    <p className="text-neutral-600" style={{ fontSize: "9px" }}>WK SCORE</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-neutral-700 text-xs mt-2 text-center">
            1★ for 30 min · 2★ for 45 min · 3★ for 60+ min
          </p>
        </div>
      )}

      {/* Recommended */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-white" style={{ fontSize: "9px", letterSpacing: "0.12em" }}>RECOMMENDED</h2>
        <Link to="/browse" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">See all →</Link>
      </div>
      <p className="text-neutral-700 text-xs mb-3">
        {thisWeek.length > 0 ? "Avoiding what you've already done this week." : "Get your week started."}
      </p>
      <div className="flex flex-col gap-3">
        {featured.map((w) => w && <WorkoutCard key={w.id} workout={w} />)}
      </div>
    </div>
  );
}
