"use client";

import { useEffect } from "react";

export default function LiffInit() {
  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) return;

    import("@line/liff").then(({ default: liff }) => {
      liff.init({ liffId }).catch((err) => {
        console.warn("LIFF init error:", err);
      });
    });
  }, []);

  return null;
}
