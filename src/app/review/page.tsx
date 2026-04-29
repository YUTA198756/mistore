"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, Mistake } from "@/lib/supabase";
import { getOrCreateChildProfile } from "@/lib/profile";
import { compressImage } from "@/lib/imageCompress";

const XP_RESOLVE = 10;
const XP_REASON_BONUS = 20;

type ViewState = "list" | "detail" | "done";

export default function ReviewPage() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>("list");
  const [currentMistake, setCurrentMistake] = useState<Mistake | null>(null);
  const [reworkFile, setReworkFile] = useState<File | null>(null);
  const [reworkPreview, setReworkPreview] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const id = await getOrCreateChildProfile();
      setProfileId(id);
      fetchMistakes();
    })();
  }, []);

  async function fetchMistakes() {
    setLoading(true);
    const { data } = await supabase
      .from("mistakes")
      .select("*")
      .eq("status", "unresolved")
      .neq("approval_status", "deleted")
      .order("created_at", { ascending: false });
    setMistakes(data ?? []);
    setLoading(false);
  }

  function openDetail(m: Mistake) {
    setCurrentMistake(m);
    setReworkFile(null);
    setReworkPreview(null);
    setReflection("");
    setView("detail");
  }

  function handleReworkCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReworkFile(file);
    setReworkPreview(URL.createObjectURL(file));
  }

  async function submitAll() {
    if (!reworkFile || !currentMistake || !profileId) return;
    setSaving(true);

    const compressed = await compressImage(reworkFile);
    const fileName = `rework_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("mistake-images")
      .upload(fileName, compressed, {
        contentType: compressed.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Rework upload error:", uploadError);
      alert(`画像の保存に失敗しました：${uploadError.message}`);
      setSaving(false);
      return;
    }

    const reworkUrl = supabase.storage
      .from("mistake-images")
      .getPublicUrl(uploadData.path).data.publicUrl;

    const hasReason = reflection.trim().length > 0;
    const additionalXp = XP_RESOLVE + (hasReason ? XP_REASON_BONUS : 0);
    const totalPending = (currentMistake.pending_xp ?? 0) + additionalXp;

    await supabase.from("mistakes").update({
      status: "resolved",
      rework_image_url: reworkUrl || null,
      reflection_text: reflection.trim() || null,
      pending_xp: totalPending,
    }).eq("id", currentMistake.id);

    setMistakes((prev) => prev.filter((m) => m.id !== currentMistake.id));
    setSaving(false);
    setView("done");
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-4">

      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={() => {
            if (view === "list") return;
            setView("list");
            setCurrentMistake(null);
          }}
          className="ghost-btn"
          style={{ width: "auto", padding: "8px 14px" }}
        >
          {view === "list" ? <a href="/">← もどる</a> : "← 一覧"}
        </button>
        <h1 className="font-dot text-lg text-gold">🔄 解き直し</h1>
      </div>

      {/* 一覧 */}
      {view === "list" && (
        <>
          {loading && (
            <div className="card text-center py-10">
              <p className="text-muted">よみこみ中…</p>
            </div>
          )}
          {!loading && mistakes.length === 0 && (
            <div className="card text-center py-10">
              <div className="text-5xl mb-4">🏆</div>
              <p className="font-bold mb-2">解き直す問題がありません！</p>
              <p className="text-sm text-muted mb-6">まずはおたからハントで<br />問題を撮影しよう！</p>
              <a href="/hunt" className="action-btn" style={{ maxWidth: 240, margin: "0 auto" }}>
                📸 おたからハントへ
              </a>
            </div>
          )}
          {!loading && mistakes.length > 0 && (
            <div className="card flex flex-col gap-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-muted">解き直す問題を選んでね</p>
                <span className="badge badge-a">{mistakes.length}問</span>
              </div>
              {mistakes.map((m) => (
                <button key={m.id} onClick={() => openDetail(m)} className="nav-btn">
                  {m.image_url ? (
                    <div className="relative shrink-0 rounded-xl overflow-hidden"
                      style={{ width: 52, height: 52, background: "rgba(0,0,0,0.4)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.image_url} alt="問題"
                        style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    </div>
                  ) : (
                    <div className="shrink-0 flex items-center justify-center text-2xl rounded-xl"
                      style={{ width: 52, height: 52, background: "rgba(0,0,0,0.3)" }}>
                      📄
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs text-muted">{formatDate(m.created_at)}</p>
                    {m.handwriting_score != null && (
                      <p className="text-xs mt-1" style={{
                        color: m.handwriting_score >= 90 ? "var(--gold)" :
                               m.handwriting_score >= 70 ? "var(--green)" : "var(--cyan)"
                      }}>
                        文字ていねいさ：{m.handwriting_score}点
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "var(--red)" }}>● 解き直し待ち</p>
                  </div>
                  <span className="nav-arrow">›</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 詳細：解き直し写真＋理由を一括送信 */}
      {view === "detail" && currentMistake && (
        <>
          <div className="card">
            <p className="text-xs text-muted mb-2">元の問題（{formatDate(currentMistake.created_at)}）</p>
            {currentMistake.image_url && (
              <a href={currentMistake.image_url} target="_blank" rel="noopener noreferrer"
                className="relative w-full rounded-2xl overflow-hidden block"
                style={{ aspectRatio:"3/4", background:"rgba(0,0,0,0.4)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentMistake.image_url} alt="元の問題"
                  style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                <div style={{
                  position:"absolute", bottom:8, right:8,
                  background:"rgba(0,0,0,0.65)", borderRadius:8, padding:"4px 10px",
                  color:"#fff", fontSize:12,
                }}>
                  🔍 タップで拡大
                </div>
              </a>
            )}
          </div>

          {/* 解き直し写真 */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm">📸 解き直した答えを撮影</p>
              <span className="badge badge-b text-xs">必須</span>
            </div>
            {reworkPreview ? (
              <div className="flex flex-col gap-2">
                <a href={reworkPreview} target="_blank" rel="noopener noreferrer"
                  className="relative w-full rounded-2xl overflow-hidden block"
                  style={{ aspectRatio:"3/4", background:"rgba(0,0,0,0.4)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reworkPreview} alt="解き直し"
                    style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                  <div style={{
                    position:"absolute", bottom:8, right:8,
                    background:"rgba(0,0,0,0.65)", borderRadius:8, padding:"4px 10px",
                    color:"#fff", fontSize:12,
                  }}>
                    🔍 タップで拡大
                  </div>
                </a>
                <button
                  onClick={() => { setReworkFile(null); setReworkPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="ghost-btn text-xs"
                >
                  📷 撮り直す
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="action-btn">
                📷 カメラで撮影
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleReworkCapture}
            />
          </div>

          {/* 理由入力 */}
          <div className="card">
            <p className="font-bold text-sm mb-1">✏️ なぜ間違えた？</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-s text-xs">＋{XP_REASON_BONUS} XP ボーナス</span>
              <span className="text-xs text-muted">書くと追加！（任意）</span>
            </div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="例：計算ミス、公式を忘れた"
              rows={3}
              className="field resize-none"
            />
          </div>

          {/* XP予告 */}
          <div className="card text-center py-3" style={{ borderColor: "rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.05)" }}>
            <p className="text-xs text-muted mb-1">送信後・承認でもらえるXP（合計）</p>
            <p className="font-dot text-2xl font-bold text-gold">
              ＋{(currentMistake.pending_xp ?? 0) + XP_RESOLVE + (reflection.trim() ? XP_REASON_BONUS : 0)} XP
            </p>
          </div>

          <button
            onClick={submitAll}
            disabled={!reworkFile || saving}
            className="action-btn"
            style={{ opacity: reworkFile ? 1 : 0.4 }}
          >
            {saving ? "送信中…" : "📢 パパ・ママに送る（承認を求める）"}
          </button>
        </>
      )}

      {/* 承認待ち完了 */}
      {view === "done" && (
        <div className="card card-gold text-center py-10">
          <div className="text-5xl mb-4 float">📮</div>
          <p className="font-dot text-xl font-bold text-gold mb-2">送信完了！</p>
          <p className="text-sm text-muted mb-6">
            パパ・ママが承認したら<br />XPとチケットがもらえるよ！
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setView("list"); setCurrentMistake(null); }} className="action-btn">
              次の問題へ
            </button>
            <a href="/" className="ghost-btn">🏠 ホームにもどる</a>
          </div>
        </div>
      )}

    </main>
  );
}
