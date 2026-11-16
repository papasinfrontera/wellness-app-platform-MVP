import {isHttpError,reply,verifySuperadmin} from "@/lib/admin/authorization";
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:Request){
 const parsed=new URL(request.url);
 const pageRaw=parsed.searchParams.get("page")||"1";
 if(!/^\\d{1,4}$/.test(pageRaw))return reply({error:"Página inválida."},400);
 const page=Number(pageRaw);
 if(page<1||page>1000)return reply({error:"Página inválida."},400);
 const auth=await verifySuperadmin(request);
 if(isHttpError(auth))return auth;
 const operator=auth.operator;
 const perPage=20;
 try{
  const {data:list,error:listError}=await operator.auth.admin.listUsers({page,perPage});
  if(listError||!list)return reply({error:"No fue posible consultar el registro de usuarios."},503);
  const ids=list.users.map(u=>u.id);
  const {data:assigned,error:assignError}=ids.length
   ?await operator.from("platform_admin_roles").select("user_id,role,is_active").in("user_id",ids)
   :{data:[],error:null};
  if(assignError)return reply({error:"No fue posible recuperar los roles administrativos."},503);
  const roles=new Map((assigned||[]).map(r=>[r.user_id,{role:r.role,is_active:r.is_active}]));
  return reply({
   page,perPage,total:typeof list.total==="number"?list.total:null,
   users:list.users.map(u=>({
    id:u.id,email:u.email||null,created_at:u.created_at,
    email_confirmed:Boolean(u.email_confirmed_at),
    last_sign_in_at:u.last_sign_in_at||null,
    banned_until:u.banned_until||null,
    admin_role:roles.get(u.id)?.is_active?roles.get(u.id)?.role||null:null
   }))
  });
 }catch{return reply({error:"No fue posible consultar las cuentas."},503)}
}
