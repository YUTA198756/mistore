"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PendingAlert() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { count: c } = await supabase
        .from("mistakes")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "pending")
        .eq("status", "resolved");
      setCount(c ?? 0);
    })();
  }, []);

  if (count === 0) return null;

  return (
    <Link href="/parent" className="card flex items-center gap-3 py-4" style={{
      borderColor: "rgba(239,68,68,0.5)",
      background: "rgba(239,68,68,0.08)",
      animation: "pulse-alert 2s ease-in-out infinite",
    }}>
      <span className="text-3xl" style={{ animation: "spin-light 1.5s linear infinite" }}>🚨</span>
      <div className="flex-1">
        <p className="font-bold text-sm" style={{ color: "var(--red)" }}>
          承認依頼が {count}件 あります
        </p>
        <p className="text-xs text-muted">タップして確認 →</p>
      </div>
      <span className="font-dot text-2xl font-bold" style={{ color: "var(--red)" }}>{count}</span>
    </Link>
  );
}
