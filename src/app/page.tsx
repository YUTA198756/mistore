import Link from "next/link";
import GachaButton from "@/components/GachaButton";
import XpStatus from "@/components/XpStatus";
import PendingAlert from "@/components/PendingAlert";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-5">

      {/* ヒーローヘッダー */}
      <div className="card card-gold text-center py-8">
        <div className="float text-5xl mb-3">🗺️</div>
        <h1 className="font-dot text-3xl text-gold mb-1">Mys-Tre</h1>
        <p className="text-base text-muted mb-1">ミス・トレ</p>
        <p className="text-sm text-muted">まちがいをお宝に変えよう！</p>
      </div>

      {/* 承認依頼アラート */}
      <PendingAlert />

      {/* ステータス */}
      <XpStatus />

      {/* コマンドメニュー */}
      <div className="card flex flex-col gap-3">
        <p className="text-xs text-muted font-dot mb-1">⚔️ クエストをえらべ</p>

        <Link href="/hunt" className="nav-btn" style={{ borderColor: "rgba(251,191,36,0.3)" }}>
          <span className="nav-icon">📸</span>
          <div>
            <div className="text-gold">おたからハント</div>
            <div className="text-xs text-muted font-normal">まちがい問題を撮影 ＋10XP</div>
          </div>
          <span className="nav-arrow">›</span>
        </Link>

        <GachaButton />

        <Link href="/review" className="nav-btn">
          <span className="nav-icon">🔄</span>
          <div>
            <div>解き直し</div>
            <div className="text-xs text-muted font-normal">解き直して ＋10〜30XP</div>
          </div>
          <span className="nav-arrow">›</span>
        </Link>

        <Link href="/shop" className="nav-btn" style={{ borderColor: "rgba(251,191,36,0.2)" }}>
          <span className="nav-icon">🏪</span>
          <div>
            <div className="text-gold">ゴールドショップ</div>
            <div className="text-xs text-muted font-normal">ゴールドでチケットと交換</div>
          </div>
          <span className="nav-arrow">›</span>
        </Link>

        <Link href="/tickets" className="nav-btn">
          <span className="nav-icon">🎫</span>
          <div>
            <div>もっているチケット</div>
            <div className="text-xs text-muted font-normal">チケットの確認・使用</div>
          </div>
          <span className="nav-arrow">›</span>
        </Link>
      </div>

      {/* おや管理リンク */}
      <div className="text-center">
        <Link href="/parent" className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          👨‍👩‍👧 保護者ページ
        </Link>
      </div>

      {/* XPシステム説明 */}
      <div className="card">
        <p className="text-xs text-cyan mb-3 font-dot">💎 けいけんちシステム</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span>📸 まちがい撮影</span>
            <span className="text-cyan font-bold">＋10 XP</span>
          </div>
          <div className="flex justify-between">
            <span>🔄 解き直し</span>
            <span className="text-cyan font-bold">＋10 XP</span>
          </div>
          <div className="flex justify-between">
            <span>✏️ 理由を書く</span>
            <span className="text-cyan font-bold">＋20 XP ボーナス</span>
          </div>
          <div className="flex justify-between">
            <span>✨ スーパー神筆（80点↑）</span>
            <span className="text-gold font-bold">XP 2倍！</span>
          </div>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs" style={{ color: "var(--purple)" }}>
            🎰 100 XP 貯まる → ガチャチケット 1枚
          </p>
        </div>
      </div>

    </main>
  );
}
