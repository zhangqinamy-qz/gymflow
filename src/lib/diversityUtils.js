import { MUSCLES } from '../data/exercises';

export const DIVERSITY = {
  RUNNING:     'running',
  BALL_SPORTS: 'ball_sports',
  UPPER_BODY:  'upper_body',
  LOWER_BODY:  'lower_body',
  CORE:        'core',
};

export const DIVERSITY_ORDER = ['running', 'ball_sports', 'upper_body', 'lower_body', 'core'];

export const DIVERSITY_LABELS = {
  running:     'CRDO 🏃',
  ball_sports: 'BALL 🏐',
  upper_body:  'UPPR 💪',
  lower_body:  'LEGS 🦵',
  core:        'CORE 🔥',
};

const UPPER = new Set([MUSCLES.CHEST, MUSCLES.SHOULDERS, MUSCLES.TRICEPS, MUSCLES.BICEPS, MUSCLES.BACK, MUSCLES.FOREARMS]);
const LOWER = new Set([MUSCLES.GLUTES, MUSCLES.QUADS, MUSCLES.HAMSTRINGS, MUSCLES.CALVES, MUSCLES.HIP_FLEXORS]);

function musclesFromItems(items, exercisesById) {
  const cats = new Set();
  for (const item of items) {
    const ex = item.exerciseId ? exercisesById[item.exerciseId] : null;
    if (!ex) continue;
    for (const m of (ex.primary || [])) {
      if (UPPER.has(m)) cats.add(DIVERSITY.UPPER_BODY);
      if (LOWER.has(m)) cats.add(DIVERSITY.LOWER_BODY);
      if (m === MUSCLES.CORE) cats.add(DIVERSITY.CORE);
    }
  }
  return [...cats];
}

// Compute diversity categories from a full workout object (has exercise data).
export function getSessionCategories(workout, exercisesById = {}) {
  if (workout.category === 'Running') return [DIVERSITY.RUNNING];
  if (workout.category === 'Ball Sports') return [DIVERSITY.BALL_SPORTS];
  return musclesFromItems(workout.main || [], exercisesById);
}

// Fallback for QuickLog where only category + a single body-part tag is known.
export function inferCategories(category, bodyPartTag) {
  if (category === 'Running') return [DIVERSITY.RUNNING];
  if (category === 'Ball Sports') return [DIVERSITY.BALL_SPORTS];
  if (!bodyPartTag) return [];
  const cats = [];
  if (UPPER.has(bodyPartTag)) cats.push(DIVERSITY.UPPER_BODY);
  if (LOWER.has(bodyPartTag)) cats.push(DIVERSITY.LOWER_BODY);
  if (bodyPartTag === MUSCLES.CORE) cats.push(DIVERSITY.CORE);
  return cats;
}

function getWeekMonday() {
  const now = new Date();
  const dow = now.getDay(); // 0 = Sunday
  const daysBack = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysBack);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Returns { score, weekStars, hitCategories } for a given session array.
// Score = this-week stars × (unique categories this week / 5).
export function computeWeeklyScore(sessions) {
  const monday = getWeekMonday();
  const weekSessions = sessions.filter((s) => new Date(s.date) >= monday);
  const weekStars = weekSessions.reduce((sum, s) => sum + (s.stars || 1), 0);
  const hitCategories = [...new Set(weekSessions.flatMap((s) => s.categories || []))];
  const score = weekStars * hitCategories.length;
  return { score, weekStars, hitCategories };
}
