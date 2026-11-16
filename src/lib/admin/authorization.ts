import {createClient,type SupabaseClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";

export const privateHeaders={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
export const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:privateHeaders});
export type SuperadminSession={operator:SupabaseClient;actorId:string;actorEmail:string};
export async function verifySuperadmin(request:Request):Promise<SuperadminSession|NextResponse>{
 const headerOrigin=request.headers.get("origin");
 const origin=new URL(request.url).origin;
 if(headerOrigin&&headerOrigin!==origin)return reply({error:"Origen no autorizado."},403);
 const token=/^Bearer ([A-Za-z0-9._~-]+)$/.exec(request.headers.get("authorization")||"")?.[1];
 if(!token)return reply({error:"Inicia sesión."},401);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!anon||!secret)return reply({error:"La administración segura no está configurada en este entorno."},503);
 const pub=createClient(url,anon,{auth:{autoRefreshToken:false,persistSession:false}});
 try{
  const [{data:user,error:uErr},{data:claims,error:cErr}]=await Promise.all([
   pub.auth.getUser(token),pub.auth.getClaims(token)
  ]);
  if(uErr||cErr||!user.user||!claims?.claims||claims.claims.sub!==user.user.id)return reply({error:"Sesión inválida."},401);
  if(claims.claims.aal!=="aal2")return reply({error:"Se requiere verificación administrativa en dos pasos."},403);
  const operator=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:role,error:rErr}=await operator.from("platform_admin_roles")
   .select("role,is_active").eq("user_id",user.user.id).maybeSingle();
  if(rErr)return reply({error:"No fue posible comprobar permisos."},503);
  if(role?.role!=="super_admin"||role.is_active!==true)return reply({error:"Solo el superadministrador puede realizar esta operación."},403);
  return {operator,actorId:user.user.id,actorEmail:user.user.email||""};
 }catch{return reply({error:"No fue posible verificar el acceso administrativo."},503)}
}
export function isHttpError(result:SuperadminSession|NextResponse):result is NextResponse{
 return result instanceof NextResponse;
}
export async function audit(session:SuperadminSession,action:string,targetType:string,targetId:string,reason:string){
 const {error}=await session.operator.from("platform_admin_audit").insert({
  actor_id:session.actorId,action,target_type:targetType,target_id:targetId,reason
 });
 return !error;
}
export const roleChoices=["operations_admin","scientific_admin","support_admin"] as const;
