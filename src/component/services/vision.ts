export interface VisionDiagnosis {
  keywords: string[];
  summary: string;
  detectedCrop: string;
  cropConfidence: number;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const OPENAI_MODEL = (import.meta.env.VITE_OPENAI_VISION_MODEL as string | undefined) || "gpt-4.1-mini";
const OPENAI_BASE_URL =
  (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) || "https://api.openai.com/v1";

function parseKeywordLine(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function parseConfidence(value: string): number {
  const n = Number(value.trim());
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function parseResponseText(text: string): VisionDiagnosis {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const keyLine = lines.find((l) => l.toLowerCase().startsWith("keywords:"));
  const summaryLine = lines.find((l) => l.toLowerCase().startsWith("summary:"));
  const cropLine = lines.find((l) => l.toLowerCase().startsWith("detectedcrop:"));
  const confidenceLine = lines.find((l) => l.toLowerCase().startsWith("cropconfidence:"));

  const keywords = keyLine ? parseKeywordLine(keyLine.replace(/^keywords:\s*/i, "")) : [];
  const summary = summaryLine ? summaryLine.replace(/^summary:\s*/i, "") : "AI image assessment completed.";
  const detectedCrop = cropLine ? cropLine.replace(/^detectedcrop:\s*/i, "").trim().toLowerCase() : "unknown";
  const cropConfidence = confidenceLine ? parseConfidence(confidenceLine.replace(/^cropconfidence:\s*/i, "")) : 0;

  return { keywords, summary, detectedCrop, cropConfidence };
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export async function analyzeCropImageWithAI(file: File): Promise<VisionDiagnosis> {
  if (!OPENAI_API_KEY) throw new Error("VITE_OPENAI_API_KEY is not configured");

  const dataUrl = await fileToDataUrl(file);
  const res = await fetch(`${OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "You are an agriculture image triage assistant. Analyze this crop/leaf image and output only 4 lines:\n" +
                "DetectedCrop: crop name in lowercase (example: cotton, rice, wheat). If unsure write unknown\n" +
                "CropConfidence: number from 0 to 1\n" +
                "Keywords: comma-separated symptom keywords in lowercase\n" +
                "Summary: one short line about likely issue class",
            },
            { type: "input_image", image_url: dataUrl },
          ],
        },
      ],
      max_output_tokens: 180,
    }),
  });

  if (!res.ok) {
    throw new Error(`Vision API error: ${res.status}`);
  }

  const data = await res.json();
  const outputText = String(data.output_text || "").trim();
  if (!outputText) {
    throw new Error("Vision API returned empty output");
  }

  const parsed = parseResponseText(outputText);
  if (!parsed.keywords.length) {
    throw new Error("Vision API did not provide usable keywords");
  }
  return parsed;
}
