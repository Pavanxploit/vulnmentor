import { NextResponse } from "next/server";
import { getDatabaseAdapterStatus } from "@/lib/progress-store";

export async function GET() {
  return NextResponse.json({
    ok: true,
    database: getDatabaseAdapterStatus(),
  });
}
