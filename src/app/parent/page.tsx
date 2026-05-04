"use client";

import { useState } from "react";
import { supabase, Mistake } from "@/lib/supabase";
import { addXp, addGold } from "@/lib/profile";

const PARENT_PASSWORD = "1115";

type AuthState = "input" | "authed";
interface MistakeRow extends Mistake { user_id: string; }

export default function ParentPage() {
  const [authState, setAuthState] = useState<AuthState>("input");
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  const [mistakes, setMistakes] = useState<MistakeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showApproved, setShowApproved] = useState(false);

  // 手動XP入力
  const [childProfileId, setChildProfileId] = useState<string | null>(null);
  const [manualXp, setManualXp] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualMsg, setManualMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // 手動ゴールド入力
  const [manualGold, setManualGold] = useState("");
  const [goldSaving, setGoldSaving] = useState(false);
  const [goldMsg, setGoldMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function handleAuth() {
    if (pw === PARENT_PASSWORD) {
      setAuthState("authed");
      loadMistakes();
      loadChildProfile();
    } else {
      setPwError(true);
    }
  }

  async function loadChildProfile() {
    const { data } = await supabase
      .from("profiles").select("id").eq("role", "child").limit(1).single();
    if (data?.id) setChildProfileId(data.id);
  }

  async function handleManualXp() {
    const amount = parseInt(manualXp, 10);
    if (!amount || amount <= 0 || !childProfileId) return;
    setManualSaving(true);
    setManualMsg(null);
    await addXp(childProfileId, amount);
    setManualMsg({ text: `＋${amount} XP を追加しました！`, ok: true });
    setManualXp("");
    setManualSaving(false);
  }

  async function handleManualGold() {
    const amount = parseInt(manualGold, 10);
    if (!amount || amount <= 0 || !childProfileId) return;
    setGoldSaving(true);
    setGoldMsg(null);
    await addGold(childProfileId, amount);
    setGoldMsg({ text: `＋${amount} ゴールドを追加しました！`, ok: true });
    setManualGold("");
    setGoldSaving(false);
  }

  async function loadMistakes() {
    setLoading(true);
    const { data } = await supabase
      .from("mistakes").select("*")
      .neq("approval_status", "deleted")
      .order("created_at", { ascending: false });
    setMistakes((data as MistakeRow[]) ?? []);
    setLoading(false);
  }

  async function handleApprove(m: MistakeRow) {
    if (processing) return;
    setProcessing(m.id);
    const xp = m.pending_xp ?? 0;
    if (xp > 0) await addXp(m.user_id, xp);
    await supabase.from("mistakes").update({
      approval_status: "approved",
      xp_earned: (m.xp_earned ?? 0) + xp,
      pending_xp: 0,
    }).eq("id", m.id);
    setProcessing(null);
    loadMistakes();
  }

  async function handleDelete(id: string) {
    if (processing) return;
    setProcessing(id);
    await supabase.from("mistakes").delete().eq("id", id);
    setConfirmDelete(null);
    setProcessing(null);
    setMistakes((prev) => prev.filter((m) => m.id !== id));
  }

  const pendingApproval = mistakes.filter((m) => m.status === "resolved" && m.approval_status === "pending");
  const pendingReview   = mistakes.filter((m) => m.status === "unresolved" && m.approval_status === "pending");
  const approved        = mistakes.filter((m) => m.approval_status === "approved");

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
  }

  /* ---- 画像サムネイル（タップで別タブに拡大表示） ---- */
  function Thumb({ src, alt, ratio = "3/4" }: { src: string | null; alt: string; ratio?: string }) {
    if (!src) {
      return (
        <div className="w-full rounded-xl flex flex-col items-center justify-center"
          style={{ aspectRatio: ratio, background: "rgba(239,68,68,0.1)", color: "var(--red)", fontSize: 11 }}>
          <p>📷 画像なし</p>
        </div>
      );
    }
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-full rounded-xl overflow-hidden block"
        style={{ aspectRatio: ratio, background: "rgba(0,0,0,0.4)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", bottom: 4, right: 4,
          background: "rgba(0,0,0,0.65)", borderRadius: 8, padding: "3px 8px",
          color: "#fff", fontSize: 11,
        }}>
          🔍 タップで拡大
        </div>
      </a>
    );
  }

  /* ---- 削除ボタン ---- */
  function DeleteBtn({ id }: { id: string }) {
    return confirmDelete === id ? (
      <div className="flex gap-2">
        <button onClick={() => handleDelete(id)} disabled={processing === id}
          className="action-btn shrink-0"
          style={{ flex:1, background:"var(--red)", fontSize:"0.8rem", padding:"8px 12px" }}>
          {processing === id ? "…" : "本当に消す"}
        </button>
        <button onClick={() => setConfirmDelete(null)} className="ghost-btn shrink-0"
          style={{ flex:1, fontSize:"0.8rem", padding:"8px 12px" }}>
          やめる
        </button>
      </div>
    ) : (
      <button onClick={() => setConfirmDelete(id)} className="ghost-btn"
        style={{ fontSize:"0.8rem", padding:"8px 12px", borderColor:"rgba(239,68,68,0.4)", color:"var(--red)", width:"100%" }}>
        🗑️ 消す
      </button>
    );
  }

  /* ---- 解き直し済み承認待ちカード ---- */
  function ApprovalCard({ m }: { m: MistakeRow }) {
    return (
      <div className="card flex flex-col gap-3" style={{ borderColor:"rgba(251,191,36,0.3)" }}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">{formatDate(m.created_at)}</p>
          <span className="badge badge-s text-xs">解き直し済み・承認待ち</span>
        </div>

        {/* 2枚の画像 */}
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-xs text-muted text-center">元の問題</p>
            <Thumb src={m.image_url} alt="元の問題" />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-xs text-muted text-center">解き直し</p>
            <Thumb src={m.rework_image_url} alt="解き直し" />
          </div>
        </div>

        {m.handwriting_score != null && (
          <p className="text-xs" style={{
            color: m.handwriting_score >= 90 ? "var(--gold)" : m.handwriting_score >= 70 ? "var(--green)" : "var(--cyan)"
          }}>
            ✍️ 文字ていねいさ：{m.handwriting_score}点{m.is_super_gacha && " 🌟 スーパー神筆"}
          </p>
        )}

        {m.reflection_text ? (
          <div className="p-3 rounded-2xl" style={{ background:"rgba(0,0,0,0.25)" }}>
            <p className="text-xs text-muted mb-1">✏️ 間違えた理由</p>
            <p className="text-sm">「{m.reflection_text}」</p>
          </div>
        ) : <p className="text-xs text-muted">✏️ 理由：なし</p>}

        <div className="flex items-center justify-between p-3 rounded-2xl"
          style={{ background:"rgba(251,191,36,0.08)" }}>
          <p className="text-xs text-muted">承認でもらえるXP</p>
          <p className="font-dot font-bold text-gold text-lg">＋{m.pending_xp ?? 0} XP</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => handleApprove(m)} disabled={processing === m.id}
            className="action-btn" style={{ flex:1, fontSize:"0.9rem" }}>
            {processing === m.id ? "…" : "✅ 承認する"}
          </button>
          <div style={{ flex:1 }}><DeleteBtn id={m.id} /></div>
        </div>
      </div>
    );
  }

  /* ---- 撮影のみカード（解き直し前でも承認可能） ---- */
  function HuntOnlyCard({ m }: { m: MistakeRow }) {
    return (
      <div className="card flex flex-col gap-3" style={{ borderColor:"rgba(34,211,238,0.2)" }}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">{formatDate(m.created_at)}</p>
          <span className="badge badge-b text-xs">撮影のみ</span>
        </div>

        {m.image_url && <Thumb src={m.image_url} alt="問題" ratio="16/9" />}

        {m.handwriting_score != null && (
          <p className="text-xs" style={{
            color: m.handwriting_score >= 90 ? "var(--gold)" : m.handwriting_score >= 70 ? "var(--green)" : "var(--cyan)"
          }}>
            ✍️ 文字ていねいさ：{m.handwriting_score}点{m.is_super_gacha && " 🌟 スーパー神筆"}
          </p>
        )}

        <div className="flex items-center justify-between p-3 rounded-2xl"
          style={{ background:"rgba(34,211,238,0.06)" }}>
          <p className="text-xs text-muted">承認でもらえるXP</p>
          <p className="font-dot font-bold text-lg" style={{ color:"var(--cyan)" }}>＋{m.pending_xp ?? 0} XP</p>
        </div>

        <p className="text-xs text-muted">※ 解き直し前でも承認できます</p>

        <div className="flex gap-2">
          <button onClick={() => handleApprove(m)} disabled={processing === m.id}
            className="action-btn" style={{ flex:1, fontSize:"0.9rem" }}>
            {processing === m.id ? "…" : "✅ 承認する"}
          </button>
          <div style={{ flex:1 }}><DeleteBtn id={m.id} /></div>
        </div>
      </div>
    );
  }

  /* ---- 承認済みカード ---- */
  function ApprovedCard({ m }: { m: MistakeRow }) {
    return (
      <div className="card flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">{formatDate(m.created_at)}</p>
          <span className="text-xs" style={{ color:"var(--green)" }}>✅ 承認済み ＋{m.xp_earned} XP</span>
        </div>
        <div className="flex gap-2">
          {m.image_url && (
            <a href={m.image_url} target="_blank" rel="noopener noreferrer"
              className="relative shrink-0 rounded-xl overflow-hidden block"
              style={{ width:64, height:85, background:"rgba(0,0,0,0.4)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.image_url} alt="問題"
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </a>
          )}
          {m.rework_image_url && (
            <a href={m.rework_image_url} target="_blank" rel="noopener noreferrer"
              className="relative shrink-0 rounded-xl overflow-hidden block"
              style={{ width:64, height:85, background:"rgba(0,0,0,0.4)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.rework_image_url} alt="解き直し"
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </a>
          )}
          <div className="flex-1 min-w-0 text-xs text-muted">
            {m.handwriting_score != null && <p>文字：{m.handwriting_score}点</p>}
            {m.reflection_text && <p className="mt-1 line-clamp-2">「{m.reflection_text}」</p>}
          </div>
        </div>
        <DeleteBtn id={m.id} />
      </div>
    );
  }

  /* =================== パスワード画面 =================== */
  if (authState === "input") {
    return (
      <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-1">
          <a href="/" className="ghost-btn" style={{ width:"auto", padding:"8px 14px" }}>← もどる</a>
          <h1 className="font-dot text-lg text-gold">👨‍👩‍👧 おや管理</h1>
        </div>
        <div className="card flex flex-col gap-4 py-8 text-center">
          <div className="text-5xl float">🔐</div>
          <p className="font-bold">保護者パスワードを入力</p>
          <input type="password" value={pw}
            onChange={(e) => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            placeholder="パスワード"
            className="field text-center text-xl tracking-widest"
            style={{ borderColor: pwError ? "var(--red)" : undefined }}
            autoFocus />
          {pwError && <p className="text-sm" style={{ color:"var(--red)" }}>⚠️ パスワードが違います</p>}
          <button onClick={handleAuth} className="action-btn">✓ ログイン</button>
        </div>
      </main>
    );
  }

  /* =================== 管理画面 =================== */
  return (
      <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <a href="/" className="ghost-btn" style={{ width:"auto", padding:"8px 14px" }}>← もどる</a>
            <h1 className="font-dot text-lg text-gold">👨‍👩‍👧 おや管理</h1>
          </div>
          <button onClick={loadMistakes} className="ghost-btn"
            style={{ width:"auto", padding:"8px 14px", fontSize:"0.8rem" }}>
            🔄 更新
          </button>
        </div>

        {loading && <div className="card text-center py-10"><p className="text-muted">よみこみ中…</p></div>}

        {/* ===== 正解XP手入力 ===== */}
        <section className="card flex flex-col gap-3" style={{ borderColor: "rgba(74,222,128,0.3)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">⭕</span>
            <h2 className="font-dot text-base" style={{ color: "var(--green)" }}>正解XP 手入力</h2>
          </div>
          <p className="text-xs text-muted">テストや問題集で正解した数だけ入力してください。<br />丸1個 ＝ 1 XP</p>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              max={999}
              value={manualXp}
              onChange={(e) => { setManualXp(e.target.value); setManualMsg(null); }}
              placeholder="正解した数"
              className="field text-center text-xl font-bold"
              style={{ flex: 1 }}
            />
            <span className="text-sm text-muted shrink-0">問 ＝</span>
            <span className="font-dot font-bold text-lg shrink-0" style={{ color: "var(--green)", minWidth: 60 }}>
              {manualXp && parseInt(manualXp) > 0 ? `＋${manualXp} XP` : "--- XP"}
            </span>
          </div>

          {manualMsg && (
            <p className="text-sm font-bold" style={{ color: manualMsg.ok ? "var(--green)" : "var(--red)" }}>
              {manualMsg.ok ? "✅ " : "⚠️ "}{manualMsg.text}
            </p>
          )}

          <button
            onClick={handleManualXp}
            disabled={manualSaving || !manualXp || parseInt(manualXp) <= 0}
            className="action-btn"
            style={{ opacity: manualXp && parseInt(manualXp) > 0 ? 1 : 0.4 }}
          >
            {manualSaving ? "追加中…" : "⭕ XPを追加する"}
          </button>
        </section>

        {/* ===== ゴールド手入力 ===== */}
        <section className="card flex flex-col gap-3" style={{ borderColor: "rgba(251,191,36,0.3)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <h2 className="font-dot text-base text-gold">ゴールド 手入力</h2>
          </div>
          <p className="text-xs text-muted">追加したいゴールドの枚数を入力してください。</p>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              max={9999}
              value={manualGold}
              onChange={(e) => { setManualGold(e.target.value); setGoldMsg(null); }}
              placeholder="ゴールド数"
              className="field text-center text-xl font-bold"
              style={{ flex: 1 }}
            />
            <span className="font-dot font-bold text-lg shrink-0 text-gold" style={{ minWidth: 80 }}>
              {manualGold && parseInt(manualGold) > 0 ? `＋${manualGold} G` : "--- G"}
            </span>
          </div>

          {goldMsg && (
            <p className="text-sm font-bold" style={{ color: goldMsg.ok ? "var(--gold)" : "var(--red)" }}>
              {goldMsg.ok ? "✅ " : "⚠️ "}{goldMsg.text}
            </p>
          )}

          <button
            onClick={handleManualGold}
            disabled={goldSaving || !manualGold || parseInt(manualGold) <= 0}
            className="action-btn"
            style={{ opacity: manualGold && parseInt(manualGold) > 0 ? 1 : 0.4, background: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.5)", color: "var(--gold)" }}
          >
            {goldSaving ? "追加中…" : "💰 ゴールドを追加する"}
          </button>
        </section>

        {!loading && (
          <>
            {/* 解き直し済み・承認待ち */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="font-dot text-base text-gold">⏳ 解き直し済み・承認待ち</h2>
                {pendingApproval.length > 0 && <span className="badge badge-s">{pendingApproval.length}件</span>}
              </div>
              {pendingApproval.length === 0
                ? <div className="card text-center py-6"><p className="text-muted text-sm">承認待ちはありません</p></div>
                : pendingApproval.map((m) => <ApprovalCard key={m.id} m={m} />)}
            </section>

            {/* 撮影のみ（解き直し前） */}
            {pendingReview.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-dot text-base" style={{ color:"var(--cyan)" }}>📸 撮影のみ（解き直し前）</h2>
                  <span className="badge badge-b">{pendingReview.length}件</span>
                </div>
                {pendingReview.map((m) => <HuntOnlyCard key={m.id} m={m} />)}
              </section>
            )}

            {/* 承認済み（折りたたみ） */}
            {approved.length > 0 && (
              <section className="flex flex-col gap-3">
                <button onClick={() => setShowApproved(!showApproved)} className="ghost-btn text-sm">
                  {showApproved ? `▲ 承認済みを隠す` : `▼ 承認済みの記録（${approved.length}件）`}
                </button>
                {showApproved && (
                  <div className="flex flex-col gap-3">
                    {approved.map((m) => <ApprovedCard key={m.id} m={m} />)}
                  </div>
                )}
              </section>
            )}

            {mistakes.length === 0 && (
              <div className="card text-center py-10">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-muted">まだ記録がありません</p>
              </div>
            )}
          </>
        )}
      </main>
  );
}
