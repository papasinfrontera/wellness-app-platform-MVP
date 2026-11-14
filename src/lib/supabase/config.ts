/** Public configuration only. Never expose SUPABASE_SERVICE_ROLE_KEY to client code. */
export function supabasePublicConfig(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return null;
 return {url,key};
}
export function supabaseConfigurationStatus(){
 return {configured:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)};
}
