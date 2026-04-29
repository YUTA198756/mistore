import { NextRequest, NextResponse } from "next/server";
import { sendToParents, flexMessage } from "@/lib/line";

// Vercel Cron から呼ばれる（毎日 21:00 UTC = 日本時間 06:00）
// CRON_SECRET で外部からの不正アクセスを防ぐ

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const appUrl = liffId
    ? `https://liff.line.me/${liffId}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? "https://mistore-delta.vercel.app");

  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "🌅 おはようございます！", weight: "bold", size: "lg", color: "#ffffff" },
        { type: "text", text: "ポンちゃんからのあさのメッセージ", size: "xs", color: "#ffffffcc" },
      ],
      backgroundColor: "#f97316",
      paddingAll: "16px",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#fff7ed",
          cornerRadius: "8px",
          paddingAll: "12px",
          contents: [
            { type: "text", text: "🐾 ポンちゃんより", weight: "bold", color: "#c2410c", size: "sm" },
            {
              type: "text",
              text: "きょうも いっしょに がんばろう！\nまちがいは のびるチャンスだよ！",
              wrap: true,
              size: "sm",
              color: "#431407",
              margin: "sm",
            },
          ],
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#f0fdf4",
          cornerRadius: "8px",
          paddingAll: "12px",
          contents: [
            { type: "text", text: "📋 きょうのミッション", weight: "bold", color: "#15803d", size: "sm" },
            { type: "text", text: "✏️  まちがい問題を 1まい さつえい", size: "sm", color: "#166534", margin: "sm" },
            { type: "text", text: "🔄  1問 とき直す", size: "sm", color: "#166534", margin: "xs" },
            {
              type: "text",
              text: "クリアすると ごほうびガチャが ひけるよ！🎰",
              size: "xs",
              color: "#4ade80",
              margin: "sm",
              wrap: true,
            },
          ],
        },
      ],
      paddingAll: "16px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "📸 おたからハントへ！", uri: `${appUrl}/hunt` },
          style: "primary",
          color: "#f97316",
          height: "sm",
        },
      ],
      paddingAll: "12px",
    },
  };

  try {
    await sendToParents([flexMessage("🌅 ポンちゃんからのあさのメッセージ", contents)]);
    return NextResponse.json({ ok: true, sent: "morning" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
