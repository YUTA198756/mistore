"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase, Mistake } from "@/lib/supabase";
import { addXp } from "@/lib/profile";

const PARENT_PASSWORD = "1115";

type AuthState = "input" | "authed";

interface MistakeWithProfile extends Mistake {
  user_id: string;
}

export default function ParentPage() {
  const [authState, setAuthState] = useState<AuthState>("input");
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  const [mistakes, setMistakes] = useState<MistakeWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showApproved, setShowApproved] = useState(false);

  function handleAuth() {
    if (pw === PARENT_PASSWORD) {
      setAuthState("authed");
      loadMistakes();
    } else {
      setPwError(true);
    }
  }

  async function loadMistakes() {
    setLoading(true);
    const { data } = await supabase
      .from("mistakes")
      .select("*")
      .neq("approval_status", "deleted")
      .order("created_at", { ascending: false });
    setMistakes((data as MistakeWithProfile[]) ?? []);
    setLoading(false);
  }

  async function handleApprove(m: MistakeWithProfile) {
    if (processing) return;
    setProcessing(m.id);
    const xp = m.pending_xp ?? 0;
    if (xp > 0) {
      await addXp(m.user_id, xp);
    }
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

  // グループ分け
  const pendingApproval = mistakes.filter(
    (m) => m.status === "resolved" && m.approval_status === "pending"
  );
  const pendingReview = mistakes.filter(
    (m) => m.status === "unresolved" && m.approval_status === "pending"
  );
  const approved = mistakes.filter((m) => m.approval_status === "approved");

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // 削除ボタン（タップ→確認→もう一度で実行）
  function DeleteBtn({ id }: { id: string }) {
    const isConfirming = confirmDelete === id;
    return isConfirming ? (
      <div className="flex gap-2">
        <button
          onClick={() => handleDelete(id)}
          disabled={processing === id}
          className="action-btn shrink-0"
          style={{ flex: 1, background: "var(--red)", fontSize: "0.8rem", padding: "8px 12px" }}
        >
          {processing === id ? "…" : "本当に消す"}
        </button>
        <button
          onClick={() => setConfirmDelete(null)}
          className="ghost-btn shrink-0"
          style={{ flex: 1, fontSize: "0.8rem", padding: "8px 12px" }}
        >
          やめる
        </button>
      </div>
    ) : (
      <button
        onClick={() => setConfirmDelete(id)}
        className="ghost-btn"
        style={{ fontSize: "0.8rem", padding: "8px 12px", borderColor: "rgba(239,68,68,0.4)", color: "var(--red)" }}
      >
        🗑️ 消す
      </button>
    );
  }

  // 1件カード（承認待ち）
  function ApprovalCard({ m }: { m: MistakeWithProfile }) {
    return (
      <div className="card flex flex-col gap-3" style={{ borderColor: "rgba(251,191,36,0.3)" }}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">{formatDate(m.created_at)}</p>
          <span className="badge badge-s text-xs">承認待ち</span>
        </div>

        {/* 画像2枚並べて表示 */}
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-xs text-muted text-center">元の問題</p>
            {m.image_url ? (
              <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                <Image src={m.image_url} alt="元の問題" fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full rounded-xl flex items-center justify-center text-2xl"
                style={{ aspectRatio: "3/4", background: "rgba(0,0,0,0.3)" }}>📄</div>
            )}
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-xs text-muted text-center">解き直し</p>
            {m.rework_image_url ? (
              <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                <Image src={m.rework_image_url} alt="解き直し" fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full rounded-xl flex items-center justify-center text-2xl"
                style={{ aspectRatio: "3/4", background: "rgba(0,0,0,0.3)" }}>❓</div>
            )}
          </div>
        </div>

        {/* 文字ていねいさスコア */}
        {m.handwriting_score != null && (
          <p className="text-xs" style={{
            color: m.handwriting_score >= 90 ? "var(--gold)" :
                   m.handwriting_score >= 70 ? "var(--green)" : "var(--cyan)"
          }}>
            ✍️ 文字ていねいさ：{m.handwriting_score}点
            {m.is_super_gacha && " 🌟 スーパー神筆"}
          </p>
        )}

        {/* 理由 */}
        {m.reflection_text ? (
          <div className="p-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.25)" }}>
            <p className="text-xs text-muted mb-1">✏️ 間違えた理由</p>
            <p className="text-sm">「{m.reflection_text}」</p>
          </div>
        ) : (
          <p className="text-xs text-muted">✏️ 理由：なし</p>
        )}

        {/* 獲得予定XP */}
        <div className="flex items-center justify-between p-3 rounded-2xl"
          style={{ background: "rgba(251,191,36,0.08)" }}>
          <p className="text-xs text-muted">承認でもらえるXP</p>
          <p className="font-dot font-bold text-gold text-lg">＋{m.pending_xp ?? 0} XP</p>
        </div>

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            onClick={() => handleApprove(m)}
            disabled={processing === m.id}
            className="action-btn"
            style={{ flex: 1, fontSize: "0.9rem" }}
          >
            {processing === m.id ? "…" : "✅ 承認する"}
          </button>
          <div style={{ flex: 1 }}>
            <DeleteBtn id={m.id} />
          </div>
        </div>
      </div>
    );
  }

  // 1件カード（一般）
  function RecordCard({ m, label }: { m: MistakeWithProfile; label: string }) {
    return (
      <div className="card flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">{formatDate(m.created_at)}</p>
          <span className="text-xs" style={{
            color: m.approval_status === "approved" ? "var(--green)" : "var(--muted)"
          }}>{label}</span>
        </div>
        <div className="flex gap-2 items-start">
          {m.image_url && (
            <div className="relative shrink-0 rounded-xl overflow-hidden" style={{ width: 60, height: 80 }}>
              <Image src={m.image_url} alt="問題" fill className="object-cover" />
            </div>
          )}
          {m.rework_image_url && (
            <div className="relative shrink-0 rounded-xl overflow-hidden" style={{ width: 60, height: 80 }}>
              <Image src={m.rework_image_url} alt="解き直し" fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {m.handwriting_score != null && (
              <p className="text-xs text-muted">文字：{m.handwriting_score}点</p>
            )}
            {m.reflection_text && (
              <p className="text-xs text-muted mt-1 truncate">「{m.reflection_text}」</p>
            )}
            {m.approval_status === "approved" && (
              <p className="text-xs mt-1" style={{ color: "var(--green)" }}>✅ XP承認済み +{m.xp_earned}</p>
            )}
          </div>
        </div>
        <DeleteBtn id={m.id} />
      </div>
    );
  }

  // ---- パスワード入力画面 ----
  if (authState === "input") {
    return (
      <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-1">
          <a href="/" className="ghost-btn" style={{ width: "auto", padding: "8px 14px" }}>← もどる</a>
          <h1 className="font-dot text-lg text-gold">👨‍👩‍👧 おや管理</h1>
        </div>
        <div className="card flex flex-col gap-4 py-8 text-center">
          <div className="text-5xl float">🔐</div>
          <p className="font-bold">保護者パスワードを入力</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            placeholder="パスワード"
            className="field text-center text-xl tracking-widest"
            style={{ borderColor: pwError ? "var(--red)" : undefined }}
            autoFocus
          />
          {pwError && (
            <p className="text-sm" style={{ color: "var(--red)" }}>
              ⚠️ パスワードが違います
            </p>
          )}
          <button onClick={handleAuth} className="action-btn">
            ✓ ログイン
          </button>
        </div>
      </main>
    );
  }

  // ---- 管理画面 ----
  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <a href="/" className="ghost-btn" style={{ width: "auto", padding: "8px 14px" }}>← もどる</a>
          <h1 className="font-dot text-lg text-gold">👨‍👩‍👧 おや管理</h1>
        </div>
        <button
          onClick={loadMistakes}
          className="ghost-btn"
          style={{ width: "auto", padding: "8px 14px", fontSize: "0.8rem" }}
        >
          🔄 更新
        </button>
      </div>

      {loading && (
        <div className="card text-center py-10">
          <p className="text-muted">よみこみ中…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ===== 承認待ち ===== */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-dot text-base text-gold">⏳ 承認待ち</h2>
              {pendingApproval.length > 0 && (
                <span className="badge badge-s">{pendingApproval.length}件</span>
              )}
            </div>
            {pendingApproval.length === 0 ? (
              <div className="card text-center py-6">
                <p className="text-muted text-sm">承認待ちはありません</p>
              </div>
            ) : (
              pendingApproval.map((m) => <ApprovalCard key={m.id} m={m} />)
            )}
          </section>

          {/* ===== 解き直し待ち ===== */}
          {pendingReview.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="font-dot text-base" style={{ color: "var(--cyan)" }}>📸 解き直し前</h2>
                <span className="badge badge-b">{pendingReview.length}件</span>
              </div>
              <p className="text-xs text-muted -mt-1">
                撮影済みですが、まだ解き直しを送っていない記録です。
              </p>
              {pendingReview.map((m) => (
                <RecordCard key={m.id} m={m} label="解き直し待ち" />
              ))}
            </section>
          )}

          {/* ===== 承認済み（折りたたみ） ===== */}
          {approved.length > 0 && (
            <section className="flex flex-col gap-3">
              <button
                onClick={() => setShowApproved(!showApproved)}
                className="ghost-btn text-sm"
              >
                {showApproved
                  ? `▲ 承認済みを隠す`
                  : `▼ 承認済みの記録（${approved.length}件）`}
              </button>
              {showApproved && (
                <div className="flex flex-col gap-3">
                  {approved.map((m) => (
                    <RecordCard key={m.id} m={m} label="✅ 承認済み" />
                  ))}
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
