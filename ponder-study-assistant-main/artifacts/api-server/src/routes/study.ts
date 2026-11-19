import { Router, type IRouter } from "express";
import {
  GenerateStudySetBody,
  GenerateStudySetResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MODEL = "gemini-3.8-flash";
const REQUEST_TIMEOUT_MS = 30_000;

const jsonShape = `{
  "title": "short study set title",
  "summary": "one-sentence overview",
  "topics": ["topic label"],
  "estimatedMinutes": 12,
  "cards": [
    {
      "id": "card-1",
      "question": "a clear recall question",
      "answer": "the accurate answer",
      "hint": "a brief memory cue",
      "difficulty": "Foundational"
    }
  ]
}`;

function extractJson(text: string) {
  const withoutFence = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end <= start) {
    throw new Error("Model response did not contain a JSON object");
  }

  return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
}

router.post("/study/generate", async (req, res) => {
  const parsedInput = GenerateStudySetBody.safeParse(req.body);

  if (!parsedInput.success) {
    res.status(400).json({
      error: "Add at least a sentence of notes or a topic to begin.",
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: "The study generator is not configured yet.",
    });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const modelResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `You are a careful study-material generator. Return ONLY valid JSON, with no markdown, commentary, or code fences. The JSON must match this exact shape:
${jsonShape}

Rules:
- Generate 5 to 8 high-quality flashcards from the user's notes or topic.
- Focus on retrieval practice, not trivia or vague definitions.
- Keep each question specific and each answer concise but complete.
- Use one of the exact difficulty values: Foundational, Applied, Advanced.
- Use stable ids like card-1, card-2, and so on.
- topics must contain 1 to 5 short labels.
- estimatedMinutes must be a whole number from 5 to 45.
- If the input is broad, choose the most useful beginner-friendly scope.`,
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: parsedInput.data.prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.35,
          },
        }),
      },
    );

    if (!modelResponse.ok) {
      req.log.warn(
        { statusCode: modelResponse.status },
        "Study model request failed",
      );
      res.status(502).json({
        error: "The study generator could not respond. Please try again.",
      });
      return;
    }

    const payload = (await modelResponse.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!rawText) {
      throw new Error("Model returned an empty response");
    }

    const candidate = extractJson(rawText);
    const validated = GenerateStudySetResponse.safeParse(candidate);

    if (!validated.success) {
      req.log.warn(
        { issues: validated.error.issues.length },
        "Study model returned the wrong shape",
      );
      res.status(502).json({
        error: "The study generator returned an incomplete study set. Please retry.",
      });
      return;
    }

    res.json(validated.data);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      res.status(504).json({
        error: "That took longer than expected. Please try again.",
      });
      return;
    }

    req.log.error({ err: error }, "Study generation failed");
    res.status(502).json({
      error: "We could not turn that into study cards. Please try again.",
    });
  } finally {
    clearTimeout(timeout);
  }
});

export default router;