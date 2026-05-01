"use client";

import { useState } from "react";
import Image from "next/image";
import CameraCapture from "@/components/CameraCapture";
import { compressImage, fileToBase64 } from "@/lib/imageCompress";
import { scoreHandwriting, GeminiScoreResult } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { getOrCreateChildProfile } from "@/lib/profile";
import { setSuperGacha } from "@/lib/gacha";

type Step = "capture" | "preview" | "scoring" | "result" | "error";

const XP_BASE = 10;
const SUPER_GACHA_THRESHOLD = 80;

export default function HuntPage() {
  const [step, setStep] = useState<Step>("capture");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [scoreResult, setScoreResult] = useState<GeminiScoreResult | null>(null);
  const [pendingXp, setPendingXp] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCapture = (file: File, url: string) => {
    setCapturedFile(file);
    setPreviewUrl(url);
    setStep("preview");
  };

  const handleSubmit = async () => {
    if (!capturedFile) return;
    setStep("scoring");

    try {
      const compressed = await compressImage(capturedFile);
      const base64 = await fileToBase64(compressed);
      const result = await scoreHandwriting(base64);

      if (!result.valid) {
        setErrorMsg("本物の問題用紙を撮影してね！\n白紙や落書きはカウントされないよ。");
        setStep("error");
        return;
      }

      const isSuperGacha = result.score >= SUPER_GACHA_THRESHOLD;
      const xp = isSuperGacha ? XP_BASE * 2 : XP_BASE;

      const profileId = await getOrCreateChildProfile();

      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("mistake-images")
        .upload(fileName, compressed, {
          contentType: compressed.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setErrorMsg(`画像の保存に失敗しました：${uploadError.message}\nもう一度やり直してね。`);
        setStep("error");
        return;
      }

      const imageUrl = supabase.storage
        .from("mistake-images")
        .getPublicUrl(uploadData.path).data.publicUrl;

      await supabase.from("mistakes").insert({
        user_id: profileId,
        image_url: imageUrl,
        status: "unresolved",
        handwriting_score: result.score,
        is_super_gacha: isSuperGacha,
        xp_earned: 0,
        pending_xp: xp,
        approval_status: "pending",
      });

      if (isSuperGacha) setSuperGacha(true);

      setScoreResult(result);
      setPendingXp(xp);
      setStep("result");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`エラー：${msg}`);
      setStep("error");
    }
  };

  const handleReset = () => {
    setStep("capture");
    setPreviewUrl(null);
    setCapturedFile(null);
    setScoreResult(null);
    setErrorMsg("");
    setPendingXp(0);
  };

  const scoreColor = scoreResult
    ? scoreResult.score >= SUPER_GACHA_THRESHOLD ? "var(--gold)"
    : scoreResult.score >= 70 ? "var(--green)" : "var(--cyan)"
    : "var(--cyan)";

  const rankLabel = scoreResult
    ? scoreResult.score >= SUPER_GACHA_THRESHOLD ? "✨ スーパー神筆！"
    : scoreResult.score >= 70 ? "👍 じょうず！" : "💪 ふつう"
    : "";

  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-4">

      <div className="flex items-center gap-3 mb-1">
        <a href="/" className="ghost-btn" style={{ width: "auto", padding: "8px 14px" }}>← もどる</a>
        <h1 className="font-dot text-lg text-gold">📸 おたからハント</h1>
      </div>

      {step === "capture" && <CameraCapture onCapture={handleCapture} />}

      {step === "preview" && previewUrl && (
        <>
          <div className="card">
            <p className="text-sm text-muted mb-3">この写真でよいですか？</p>
            <div className="relative w-full overflow-hidden rounded-2xl mb-2" style={{ aspectRatio: "3/4" }}>
              <Image src={previewUrl} alt="撮影した問題" fill className="object-cover" />
            </div>
          </div>
          <button onClick={handleSubmit} className="action-btn">
            🔍 AIに採点してもらう
          </button>
          <button onClick={handleReset} className="ghost-btn">
            📷 撮り直す
          </button>
        </>
      )}

      {step === "scoring" && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-6 float">🐶</div>
          <p className="font-bold text-base mb-2 text-cyan">ポンちゃんが採点中…</p>
          <p className="text-sm text-muted flash">文字のていねいさをチェック中</p>
        </div>
      )}

      {step === "result" && scoreResult && (
        <>
          {scoreResult.score >= SUPER_GACHA_THRESHOLD && (
            <div className="card card-gold text-center py-5">
              <p className="text-2xl mb-2 float">✨</p>
              <p className="font-dot text-lg pulse-gold text-gold">スーパー神筆ボーナス！</p>
              <p className="text-sm mt-1" style={{ color: "var(--gold-lt)" }}>
                XP 2倍 ＆ スーパーガチャ権利獲得！
              </p>
            </div>
          )}

          <div className="card">
            <p className="text-xs text-muted mb-4 font-dot">🐾 ポンちゃんの採点結果</p>
            <div className="flex justify-between items-end mb-3">
              <span className="font-bold">文字のていねいさ</span>
              <span className="text-3xl font-dot font-bold" style={{ color: scoreColor }}>
                {scoreResult.score}<span className="text-lg">点</span>
              </span>
            </div>
            <div className="xp-track mb-2" style={{ height: 16 }}>
              <div className="xp-fill" style={{
                width: `${scoreResult.score}%`,
                background: scoreResult.score >= SUPER_GACHA_THRESHOLD
                  ? "linear-gradient(90deg, #fbbf24, #f97316)"
                  : scoreResult.score >= 70
                  ? "linear-gradient(90deg, #4ade80, #22d3ee)"
                  : "linear-gradient(90deg, #22d3ee, #a855f7)",
              }} />
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold" style={{ color: scoreColor }}>{rankLabel}</span>
              {scoreResult.score >= SUPER_GACHA_THRESHOLD && <span className="badge badge-s">神筆</span>}
            </div>
            <div className="p-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.25)" }}>
              <p className="text-xs text-muted mb-1">🐾 ポンちゃんより</p>
              <p className="text-sm">「{scoreResult.comment}」</p>
            </div>
          </div>

          <div className="card text-center py-5" style={{ borderColor: "rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.06)" }}>
            <p className="text-xs text-muted mb-1">承認後に獲得予定</p>
            <p className="font-dot text-3xl font-bold text-gold">＋{pendingXp} XP</p>
            <p className="text-xs mt-2" style={{ color: "var(--gold-lt)" }}>
              次は解き直しをしてパパ・ママに承認してもらおう！
            </p>
          </div>

          <button onClick={handleReset} className="action-btn">📸 もう1枚撮る</button>
          <a href="/review" className="ghost-btn">🔄 解き直しへ</a>
          <a href="/" className="ghost-btn">🏠 ホームにもどる</a>
        </>
      )}

      {step === "error" && (
        <div className="card card-red">
          <div className="text-center text-4xl mb-4">😅</div>
          <p className="text-sm mb-4 whitespace-pre-line" style={{ color: "var(--red)" }}>
            {errorMsg}
          </p>
          <button onClick={handleReset} className="action-btn">もう一度チャレンジ！</button>
        </div>
      )}

    </main>
  );
}
