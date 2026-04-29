"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase, Mistake } from "@/lib/supabase";
import { getOrCreateChildProfile, addXp } from "@/lib/profile";
import { compressImage } from "@/lib/imageCompress";

const XP_RESOLVE = 10;
const XP_REASON_BONUS = 20;

type ViewState = "list" | "detail" | "reason" | "done";

interface DoneState {
  xpEarned: number;
  ticketsEarned: number;
}

export default function ReviewPage() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>("list");
  const [currentMistake, setCurrentMistake] = useState<Mistake | null>(null);
  const [reworkFile, setReworkFile] = useState<File | null>(null);
  const [reworkPreview, setReworkPreview] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState(false);
  const [doneState, setDoneState] = useState<DoneState | null>(null);
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
      .from("mistakes").select("*").eq("status", "unresolved")
      .order("created_at", { ascending: false });
    setMistakes(data ?? []);
    setLoading(false);
  }

  function openDetail(m: Mistake) {
    setCurrentMistake(m);
    setReworkFile(null);
    setReworkPreview(null);
    setView("detail");
  }

  function handleReworkCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReworkFile(file);
    setReworkPreview(URL.createObjectURL(file));
  }

  async function submitRework() {
    if (!reworkFile || !currentMistake || !profileId) return;
    setSaving(true);

    const compressed = await compressImage(reworkFile);
    const { data: uploadData } = await supabase.storage
      .from("mistake-images")
      .upload(`rework_${Date.now()}_${compressed.name}`, compressed, {
        contentType: "image/jpeg",
        upsert: false,
      });

    const reworkUrl = uploadData
      ? supabase.storage.from("mistake-images").getPublicUrl(uploadData.path).data.publicUrl
      : "";

    await supabase.from("mistakes").update({
      status: "resolved",
      rework_image_url: reworkUrl || null,
      xp_earned: (currentMistake.xp_earned ?? 0) + XP_RESOLVE,
    }).eq("id", currentMistake.id);

    const r = await addXp(profileId, XP_RESOLVE);
    setDoneState({ xpEarned: XP_RESOLVE, ticketsEarned: r.ticketsEarned });
    setMistakes((prev) => prev.filter((m) => m.id !== currentMistake.id));
    setReflection("");
    setSaving(false);
    setView("reason");
  }

  async function submitReason() {
    if (!currentMistake || !profileId) return;
    if (!reflection.trim()) { setView("done"); return; }
    setSaving(true);

    await supabase.from("mistakes").update({
      reflection_text: reflection.trim(),
      xp_earned: (currentMistake.xp_earned ?? 0) + XP_RESOLVE + XP_REASON_BONUS,
    }).eq("id", currentMistake.id);

    const r = await addXp(profileId, XP_REASON_BONUS);
    setDoneState((prev) => prev
      ? { xpEarned: prev.xpEarned + XP_REASON_BONUS, ticketsEarned: prev.ticketsEarned + r.ticketsEarned }
      : { xpEarned: XP_REASON_BONUS, ticketsEarned: r.ticketsEarned }
    );
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
            if (view === "detail") { setView("list"); setCurrentMistake(null); }
            if (view === "reason") setView("detail");
          }}
          className="ghost-btn"
          style={{ width: "auto", padding: "8px 14px" }}
        >
          {view === "list"
            ? <a href="/">← もどる</a>
            : "← もどる"
          }
        </button>
        <h1 className="font-dot text-lg text-gold">🔄 とき直し</h1>
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
                      style={{ width: 52, height: 52 }}>
                      <Image src={m.image_url} alt="問題" fill className="object-cover" />
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

      {/* 詳細：解き直し写真を撮る */}
      {view === "detail" && currentMistake && (
        <>
          <div className="card">
            <p className="text-xs text-muted mb-2">{formatDate(currentMistake.created_at)} の問題</p>
            {currentMistake.image_url && (
              <div className="relative w-full rounded-2xl overflow-hidden mb-2" style={{ aspectRatio: "3/4" }}>
                <Image src={currentMistake.image_url} alt="元の問題" fill className="object-cover" />
              </div>
            )}
            <p className="text-xs text-center text-muted">↑ 元の問題</p>
          </div>

          <div className="card">
            <p className="font-bold text-sm mb-1">📸 解き直した答えを撮影しよう</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-b text-xs">＋{XP_RESOLVE} XP</span>
              <span className="text-xs text-muted">写真を撮ると獲得！</span>
            </div>

            {reworkPreview ? (
              <div className="flex flex-col gap-3">
                <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                  <Image src={reworkPreview} alt="解き直し" fill className="object-cover" />
                </div>
                <button
                  onClick={() => { setReworkFile(null); setReworkPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="ghost-btn text-xs"
                >
                  📷 撮り直す
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="action-btn"
              >
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

          <button
            onClick={submitRework}
            disabled={!reworkFile || saving}
            className="action-btn"
            style={{ opacity: reworkFile ? 1 : 0.4 }}
          >
            {saving ? "保存中…" : `✅ 解き直し完了！（＋${XP_RESOLVE} XP）`}
          </button>
        </>
      )}

      {/* 理由入力 */}
      {view === "reason" && (
        <>
          <div className="card card-green text-center py-6">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-dot text-lg font-bold text-green mb-1">解き直し完了！</p>
            <p className="font-dot text-2xl font-bold text-gold">＋{XP_RESOLVE} XP</p>
            {doneState && doneState.ticketsEarned > 0 && (
              <p className="font-dot text-sm pulse-gold mt-2" style={{ color: "var(--purple)" }}>
                🎰 ガチャチケット ×{doneState.ticketsEarned} 獲得！
              </p>
            )}
          </div>

          <div className="card">
            <p className="font-bold text-sm mb-1">✏️ なぜ間違えた？</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-s text-xs">＋{XP_REASON_BONUS} XP ボーナス</span>
              <span className="text-xs text-muted">書くと追加獲得！</span>
            </div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="例：計算ミス、公式を忘れた"
              rows={3}
              className="field resize-none"
            />
          </div>

          <button onClick={submitReason} disabled={saving} className="action-btn">
            {saving ? "保存中…" : reflection.trim()
              ? `📢 ＋${XP_REASON_BONUS} XP もらう！`
              : "スキップしてホームへ"}
          </button>
        </>
      )}

      {/* 完了 */}
      {view === "done" && doneState && (
        <div className="card card-gold text-center py-10">
          <div className="text-5xl mb-4 float">🏆</div>
          <p className="font-dot text-xl font-bold text-gold mb-2">ぜんぶ完了！</p>
          <p className="text-4xl font-dot font-bold text-gold mb-2">＋{doneState.xpEarned} XP</p>
          {doneState.ticketsEarned > 0 && (
            <p className="font-dot text-base pulse-gold mb-4" style={{ color: "var(--purple)" }}>
              🎰 ガチャチケット ×{doneState.ticketsEarned} 獲得！
            </p>
          )}
          <p className="text-sm text-muted mb-6">まちがいを宝に変えた！<br />経験値が上がったぞ！</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setView("list"); setCurrentMistake(null); setDoneState(null); }} className="action-btn">
              次の問題へ
            </button>
            <a href="/" className="ghost-btn">🏠 ホームにもどる</a>
          </div>
        </div>
      )}

    </main>
  );
}
