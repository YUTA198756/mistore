import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "画像が必要です" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `この画像は小学生が書いた算数・国語などの問題用紙またはノートです。
以下の基準で評価してください。

1. valid: 本物の勉強の痕跡（問題・計算・文章など）があればtrue。白紙・落書き・関係ない画像ならfalse。
2. score: 文字の丁寧さを0〜100で採点。筆算・図・式の書き込みがあれば+10ボーナス（上限100）。
3. comment: 小学4年生の男の子を元気づける短い一言（日本語、40文字以内）。

必ずJSON形式のみで返してください（説明文不要）:
{"valid": true, "score": 75, "comment": "丁寧に書けてるね！すごい！"}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: image,
        },
      },
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AIからの応答が不正です");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Gemini API error:", err);
    return NextResponse.json(
      { error: "AI鑑定エラー", valid: false, score: 0, comment: "もう一度試してね！" },
      { status: 500 }
    );
  }
}
