import { NextResponse } from "next/server";
import { checkDatabase } from "@/lib/supabase/health";
export const dynamic = "force-dynamic";
export async function GET() {
  const database=await checkDatabase();
  return NextResponse.json({
    service:"wellness-app",version:"6.2",status:"foundation",
    database:{ configured:database.configured,apiReachable:database.reachable,schemaAccessible:database.schemaAccessible,verified:database.schemaAccessible },
    documentStorage:{configured:true,accessVerified:false},
    ai:{enabled:false,knowledgeIndexReady:false},
    importers:{laboratoryPdfReady:false,whoopReady:false}
  },{headers:{"Cache-Control":"no-store"}});
}
