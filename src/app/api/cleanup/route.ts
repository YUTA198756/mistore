import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Vercel Cron から毎日1回呼ばれる
// 3ヶ月（90日）以上前の承認済み・削除済みレコードをDBから削除
// ストレージの画像ファイルも合わせて削除

const RETENTION_DAYS = 90;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // サービスロールキーでストレージ操作も確実に行う
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const cutoffISO = cutoff.toISOString();

  // 3ヶ月以上前のレコードを取得
  const { data: oldRecords, error: fetchError } = await supabase
    .from("mistakes")
    .select("id, image_url, rework_image_url")
    .lt("created_at", cutoffISO);

  if (fetchError) {
    console.error("Cleanup fetch error:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!oldRecords || oldRecords.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0, message: "No old records" });
  }

  // ストレージの画像ファイルを削除
  const filePaths: string[] = [];
  for (const rec of oldRecords) {
    for (const url of [rec.image_url, rec.rework_image_url]) {
      if (!url) continue;
      // URL例: https://xxx.supabase.co/storage/v1/object/public/mistake-images/filename.jpg
      const match = url.match(/\/mistake-images\/(.+)$/);
      if (match) filePaths.push(match[1]);
    }
  }

  if (filePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("mistake-images")
      .remove(filePaths);
    if (storageError) console.error("Storage cleanup error:", storageError);
  }

  // DBレコードを削除
  const ids = oldRecords.map((r) => r.id);
  const { error: deleteError } = await supabase
    .from("mistakes")
    .delete()
    .in("id", ids);

  if (deleteError) {
    console.error("Cleanup delete error:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  console.log(`Cleanup: deleted ${ids.length} records, ${filePaths.length} files`);
  return NextResponse.json({
    ok: true,
    deleted: ids.length,
    filesRemoved: filePaths.length,
  });
}
