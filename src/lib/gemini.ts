export interface GeminiScoreResult {
  valid: boolean;
  score: number;
  comment: string;
}

export async function scoreHandwriting(
  base64Image: string
): Promise<GeminiScoreResult> {
  const res = await fetch("/api/gemini-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!res.ok) {
    throw new Error("AI鑑定に失敗しました");
  }

  return res.json();
}
