"use client";

import { useState } from "react";
import Image from "next/image";
import CameraCapture from "@/components/CameraCapture";
import ScoreDisplay from "@/components/ScoreDisplay";
import { compressImage, fileToBase64 } from "@/lib/imageCompress";
import { scoreHandwriting, GeminiScoreResult } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { getOrCreateChildProfile, addXp } from "@/lib/profile";
import { setSuperGacha } from "@/lib/gacha";

type Step = "capture" | "preview" | "scoring" | "result" | "error";

const XP_BASE = 10;
const SUPER_GACHA_THRESHOLD = 90;

export default function HuntPage() {
  const [step, setStep] = useState<Step>("capture");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [scoreResult, setScoreResult] = useState<GeminiScoreResult | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [ticketsEarned, setTicketsEarned] = useState(0);
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

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("mistake-images")
        .upload(`${Date.now()}_${compressed.name}`, compressed, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) console.error("Upload error:", uploadError);

      const imageUrl = uploadData
        ? supabase.storage.from("mistake-images").getPublicUrl(uploadData.path).data.publicUrl
        : "";

      await supabase.from("mistakes").insert({
        user_id: profileId,
        image_url: imageUrl,
        status: "unresolved",
        handwriting_score: result.score,
        is_super_gacha: isSuperGacha,
        xp_earned: xp,
      });

      let earned = 0;
      if (profileId) {
        const r = await addXp(profileId, xp);
        earned = r.ticketsEarned;
      }
      if (isSuperGacha) setSuperGacha(true);

      setScoreResult(result);
      setXpEarned(xp);
      setTicketsEarned(earned);
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
    setTicketsEarned(0);
  };

  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-4">

      {/* ヘッダー */}
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
          <ScoreDisplay
            result={scoreResult}
            xpEarned={xpEarned}
            isSuperGacha={scoreResult.score >= SUPER_GACHA_THRESHOLD}
          />
          {ticketsEarned > 0 && (
            <div className="card text-center py-4" style={{ borderColor: "rgba(168,85,247,0.5)", background: "rgba(168,85,247,0.08)" }}>
              <p className="font-dot text-lg pulse-gold" style={{ color: "var(--purple)" }}>
                🎰 ガチャチケット ×{ticketsEarned} 獲得！
              </p>
            </div>
          )}
          <button onClick={handleReset} className="action-btn">📸 もう1枚撮る</button>
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
