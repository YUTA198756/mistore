import { NextRequest, NextResponse } from "next/server";
import { sendToParents, flexMessage } from "@/lib/line";
import { createClient } from "@supabase/supabase-js";

// Vercel Cron から呼ばれる（毎日 11:00 UTC = 日本時間 20:00）

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
  );
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // 今日（日本時間）の範囲を取得
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayJST = jstNow.toISOString().slice(0, 10);
  const todayStart = `${todayJST}T00:00:00+09:00`;
  const todayEnd   = `${todayJST}T23:59:59+09:00`;

  // 今日の撮影数・XP・解き直し数を集計
  const { data: todayMistakes } = await supabase
    .from("mistakes")
    .select("xp_earned, status")
    .gte("created_at", todayStart)
    .lte("created_at", todayEnd);

  const shotCount     = todayMistakes?.length ?? 0;
  const resolvedCount = todayMistakes?.filter((m) => m.status === "resolved").length ?? 0;
  const totalXp       = todayMistakes?.reduce((sum, m) => sum + (m.xp_earned ?? 0), 0) ?? 0;
  const gachaUnlocked = shotCount >= 1 && resolvedCount >= 1;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const appUrl = liffId
    ? `https://liff.line.me/${liffId}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? "https://mistore-delta.vercel.app");

  // 成果に応じたメッセージ
  const comment =
    shotCount === 0
      ? "きょうはまだ さつえいしていないよ。\nあと少し！いっしょに がんばろう！"
      : resolvedCount === 0
      ? `${shotCount}まい さつえいできた！\nとき直しも わすれずにね！`
      : `さつえい ${shotCount}まい、とき直し ${resolvedCount}問！\nすばらしい！この ちょうしで いこう！`;

  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "🌙 きょうの おたからほうこく", weight: "bold", size: "lg", color: "#ffffff" },
        { type: "text", text: todayJST, size: "xs", color: "#ffffffcc" },
      ],
      backgroundColor: "#7c3aed",
      paddingAll: "16px",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        // スコアカード
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          contents: [
            {
              type: "box", layout: "vertical", flex: 1,
              backgroundColor: "#fff7ed", cornerRadius: "8px", paddingAll: "10px",
              contents: [
                { type: "text", text: "📸 さつえい", size: "xxs", color: "#9a3412" },
                { type: "text", text: `${shotCount}まい`, weight: "bold", size: "xl", color: "#ea580c" },
              ],
            },
            {
              type: "box", layout: "vertical", flex: 1,
              backgroundColor: "#f0fdf4", cornerRadius: "8px", paddingAll: "10px",
              contents: [
                { type: "text", text: "✅ とき直し", size: "xxs", color: "#14532d" },
                { type: "text", text: `${resolvedCount}問`, weight: "bold", size: "xl", color: "#16a34a" },
              ],
            },
            {
              type: "box", layout: "vertical", flex: 1,
              backgroundColor: "#faf5ff", cornerRadius: "8px", paddingAll: "10px",
              contents: [
                { type: "text", text: "⭐ XP", size: "xxs", color: "#581c87" },
                { type: "text", text: `+${totalXp}`, weight: "bold", size: "xl", color: "#7c3aed" },
              ],
            },
          ],
        },
        // ポンちゃんコメント
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#fff7ed",
          cornerRadius: "8px",
          paddingAll: "12px",
          contents: [
            { type: "text", text: "🐾 ポンちゃんより", weight: "bold", color: "#c2410c", size: "sm" },
            { type: "text", text: comment, wrap: true, size: "sm", color: "#431407", margin: "sm" },
          ],
        },
        // ガチャ解放通知
        ...(gachaUnlocked ? [{
          type: "box",
          layout: "vertical",
          backgroundColor: "#fef9c3",
          cornerRadius: "8px",
          paddingAll: "12px",
          contents: [
            {
              type: "text",
              text: "🎰 ごほうびガチャが ひけるよ！\nわすれずに ひいてね！",
              wrap: true, weight: "bold", size: "sm", color: "#854d0e",
            },
          ],
        }] : []),
      ],
      paddingAll: "16px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "アプリを開く", uri: appUrl },
          style: "primary",
          color: "#7c3aed",
          height: "sm",
        },
      ],
      paddingAll: "12px",
    },
  };

  try {
    await sendToParents([flexMessage("🌙 きょうの おたからほうこく", contents)]);
    return NextResponse.json({ ok: true, sent: "evening", stats: { shotCount, resolvedCount, totalXp, gachaUnlocked } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
