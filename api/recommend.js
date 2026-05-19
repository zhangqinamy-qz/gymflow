// Vercel serverless function: proxies a workout-analysis request to OpenRouter.
// Locally, vite.config.js routes /api/recommend to this same handler via a dev middleware.

const MODEL = "anthropic/claude-sonnet-4.5";

function buildPrompt(history = [], profile = {}) {
  const recent = history.slice(0, 30);
  const summary = recent.length
    ? recent
        .map((h) => {
          const cats = h.categories?.length ? `, ${h.categories.join("/")}` : "";
          return `- ${h.date}: ${h.title} (${h.duration || 0}m, ${h.stars || 1}★${cats})`;
        })
        .join("\n")
    : "(no workouts logged yet)";

  const equipment = (profile.equipment || []).join(", ") || "unknown";

  return `You are a friendly gym coach for the GYMBUDDY app.

Profile: ${profile.name || "User"} · level ${profile.level || "unknown"} · equipment: ${equipment}.

Recent workouts (newest first):
${summary}

Generate 2-3 personalized next workouts. Respond with STRICT JSON ONLY (no markdown fences, no commentary). The shape MUST be:

{
  "analysis": "1-2 sentence summary of patterns or gaps. Encouraging.",
  "workouts": [
    {
      "title": "Short workout name (e.g. Upper Body Push)",
      "category": "Strength" | "Running" | "Ball Sports",
      "duration": 30,
      "reason": "One short sentence on why this fits.",
      "warmup": [{ "name": "Arm circles", "duration": "30 sec" }],
      "main":   [{ "name": "Bench Press", "sets": 4, "reps": "8-10" }],
      "cooldown":[{ "name": "Chest stretch", "duration": "30 sec" }]
    }
  ]
}

Rules:
- 4-6 main exercises per workout. 2-3 warmup, 2-3 cooldown items.
- Use exercise names the user can recognize (e.g. "Push-ups", "Bench Press", "Easy Run").
- Categories must be exactly one of: "Strength", "Running", "Ball Sports".
- Duration is total minutes (integer).
- reps can be a number-range string like "8-10" or a duration like "30 sec".
- Use the profile's equipment when possible. If no equipment, prefer bodyweight.
- Avoid muscle groups/categories the user clearly overdid this week.`;
}

function extractJSON(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "POST only" }));
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "OPENROUTER_API_KEY is not set" }));
  }

  const { history, profile } = req.body || {};
  const prompt = buildPrompt(history, profile);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/zhangqinamy-qz/gymflow",
        "X-Title": "GYMBUDDY",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.statusCode = response.status;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: data?.error?.message || "OpenRouter request failed" }));
    }

    const raw = data?.choices?.[0]?.message?.content || "";
    const parsed = extractJSON(raw);
    if (!parsed || !Array.isArray(parsed.workouts)) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "AI returned an unexpected format. Try again.", raw }));
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ analysis: parsed.analysis || "", workouts: parsed.workouts }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: err.message || "Unknown error" }));
  }
}
