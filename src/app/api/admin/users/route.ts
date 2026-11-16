import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const noCache={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
function respond(payload:unknown,status=200){return NextResponse.json(payload,{status,headers:noCache});}
function denied(status:number){return respond({error:status===401?"Inicia sesión.":"Acceso administrativo no autorizado."},status)}

export async function GET(request:Request){
 const origin=new URL(request.url).origin;
 const headerOrigin=request.headers.get("origin");
 // Enforce same-site when the browser supplies Origin. Bearer access tokens are mandatory.
 if(headerOrigin&&headerOrigin!==origin)return denied(403);
 const auth=request.headers.get("authorization")||"";
 const match=/^Bearer ([A-Za-z0-9._~-]+)$/.exec(auth);
 if(!match)return denied(401);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const publicKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!publicKey||!serviceKey)return respond({error:"Módulo administrativo pendiente de configuración segura en el servidor."},503);

 const parsed=new URL(request.url);
 const pageRaw=parsed.searchParams.get("page")||"1";
 if(!/^\d{1,4}$/.test(pageRaw))return respond({error:"Página inválida."},400);
 const page=Number(pageRaw);
 if(page<1||page>1000)return respond({error:"Página inválida."},400);
 const perPage=20;
 const publicClient=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  // Both operations validate the supplied token; client metadata is never trusted for roles.
  const [{data:userData,error:userError},{data:claimsData,error:claimsError}]=await Promise.all([
   publicClient.auth.getUser(match[1]),
   publicClient.auth.getClaims(match[1])
  ]);
  if(userError||claimsError||!userData.user||claimsData?.claims?.sub!==userData.user.id)return denied(401);
  if(claimsData.claims.aal!=="aal2")return respond({error:"Requiere autenticación administrativa en dos pasos."},403);
  const operator=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:adminRole,error:roleError}=await operator.from("platform_admin_roles")
    .select("role,is_active").eq("user_id",userData.user.id).maybeSingle();
  if(roleError)return respond({error:"No fue posible verificar el permiso administrativo."},503);
  if(adminRole?.role!=="super_admin"||adminRole.is_active!==true)return denied(403);
  const {data:list,error:listError}=await operator.auth.admin.listUsers({page,perPage});
  if(listError||!list)return respond({error:"No fue posible consultar el registro de usuarios."},503);
  const ids=list.users.map(u=>u.id);
  const {data:assigned,error:assignError}=ids.length
   ?await operator.from("platform_admin_roles").select("user_id,role,is_active").in("user_id",ids)
   :{data:[],error:null};
  if(assignError)return respond({error:"No fue posible recuperar los roles administrativos."},503);
  const roles=new Map((assigned||[]).map(r=>[r.user_id,{role:r.role,is_active:r.is_active}]));
  return respond({
   page,perPage,total:typeof list.total==="number"?list.total:null,
   users:list.users.map(u=>({
    id:u.id,
    email:u.email||null,
    created_at:u.created_at,
    email_confirmed:Boolean(u.email_confirmed_at),
    last_sign_in_at:u.last_sign_in_at||null,
    admin_role:roles.get(u.id)?.is_active?roles.get(u.id)?.role||null:null
   }))
  });
 }catch{
  return respond({error:"No fue posible verificar la sesión o consultar las cuentas."},503);
 }
}
