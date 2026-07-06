// ai-session: single Edge Function for both voice transcription and
// AI parsing, so the Gemini API key never leaves the server.
//
// Modes:
//   { mode: 'transcribe', audio: <base64>, mimeType: 'audio/m4a' } → { transcript }
//   { mode: 'parse', text: <string> }                              → ParsedSession JSON

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const TRANSCRIBE_PROMPT =
  'Transcribe this audio exactly as spoken. Return only the transcription text, nothing else.';

const PARSE_PROMPT = `You are a fitness logging assistant. The user will give you an unstructured description of their workout or physical activity session. Your job is to parse it into a structured JSON object.

Always return ONLY valid JSON with no markdown, no backticks, no explanation, no preamble. Return exactly this structure:
{
  'activity_type': 'gym' | 'sport' | 'cardio',
  'summary': 'one sentence describing what they did',
  'exercises': [
    {
      'name': 'exercise name',
      'sets': number or null,
      'reps': number or null,
      'weight_lbs': number or null,
      'duration_minutes': number or null,
      'notes': 'any relevant note or null'
    }
  ],
  'total_duration_minutes': number or null,
  'perceived_effort': number between 1-10 or null,
  'sport_or_activity': 'name of sport or cardio activity if not gym, else null'
}

Rules:
- Lifting/weights → 'gym'. Named sport (basketball, pickleball, tennis, soccer etc) → 'sport'. Running, cycling, swimming, hiking, rowing → 'cardio'
- If they did multiple types, use the primary type and note the rest in the exercises array
- If a field cannot be inferred from what they said, use null. Never guess at numbers not explicitly mentioned
- Summaries: short, punchy, first person. Example: 'Hit chest and back, finished with an hour of pickleball.'

User input: `;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function callGemini(
  apiKey: string,
  parts: unknown[],
  jsonOutput: boolean,
): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts }],
      ...(jsonOutput
        ? { generationConfig: { response_mime_type: 'application/json' } }
        : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('Gemini returned no text');
  }
  return text;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return json({ error: 'GEMINI_API_KEY is not configured' }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    if (body.mode === 'transcribe') {
      const { audio, mimeType } = body;
      if (typeof audio !== 'string' || typeof mimeType !== 'string') {
        return json({ error: 'transcribe requires audio (base64) and mimeType' }, 400);
      }
      const transcript = await callGemini(
        apiKey,
        [
          { inline_data: { mime_type: mimeType, data: audio } },
          { text: TRANSCRIBE_PROMPT },
        ],
        false,
      );
      return json({ transcript: transcript.trim() });
    }

    if (body.mode === 'parse') {
      const { text } = body;
      if (typeof text !== 'string' || !text.trim()) {
        return json({ error: 'parse requires non-empty text' }, 400);
      }
      const raw = await callGemini(apiKey, [{ text: PARSE_PROMPT + text }], true);
      // Defensive: strip markdown fences if the model adds them anyway.
      const cleaned = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
      return json(JSON.parse(cleaned));
    }

    return json({ error: "mode must be 'transcribe' or 'parse'" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
