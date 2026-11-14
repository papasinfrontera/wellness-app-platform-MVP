import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

// This endpoint reports configuration only. It intentionally never exposes
// connection strings, API keys, patient data or privileged configuration.
export async function GET() {
 const supabaseConfigured = Boolean(
   process.env.NEXT_PUBLIC_SUPABASE_URL &&
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 );
 return NextResponse.json({
   service: "wellness-app",
   version: "6.2",
   status: "foundation",
   database: {
     configured: supabaseConfigured,
     verified: false,
     migrationsApplied: false
   },
   documentStorage: { verified: false },
   ai: { enabled: false, knowledgeIndexReady: false },
   importers: { laboratoryPdfReady: false, whoopReady: false }
 }, { headers: { "Cache-Control": "no-store" } });
}
