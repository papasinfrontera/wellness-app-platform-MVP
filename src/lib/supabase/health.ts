export type DatabaseHealth = { configured:boolean; reachable:boolean; schemaAccessible:boolean };
export async function checkDatabase(): Promise<DatabaseHealth> {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { configured:false, reachable:false, schemaAccessible:false };
  try {
    const response=await fetch(url.replace(/\/$/,"")+"/rest/v1/indicators?select=id&limit=1",{
      method:"GET",
      headers:{ apikey:key, Authorization:"Bearer "+key, Accept:"application/json" },
      cache:"no-store",
      signal:AbortSignal.timeout(6000),
    });
    return { configured:true, reachable:response.status!==0 && response.status<500, schemaAccessible:response.ok };
  } catch { return { configured:true,reachable:false,schemaAccessible:false }; }
}
