import {NextResponse} from "next/server";
import {audit,isHttpError,reply,roleChoices,verifySuperadmin} from "@/lib/admin/authorization";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Action="invite"|"set_role"|"suspend"|"reactivate";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function POST(request:Request):Promise<NextResponse>{
 if(!request.headers.get("content-type")?.startsWith("application/json"))return reply({error:"Se requiere JSON."},415);
 const length=Number(request.headers.get("content-length")||"0");
 if(length>4096)return reply({error:"Solicitud demasiado grande."},413);
 const auth=await verifySuperadmin(request);
 if(isHttpError(auth))return auth;
 let body:Record<string,unknown>;
 try{body=await request.json() as Record<string,unknown>}catch{return reply({error:"Solicitud inválida."},400)}
 if(!body||typeof body!=="object"||Array.isArray(body))return reply({error:"Solicitud inválida."},400);
 const action=body.action as Action;
 if(!["invite","set_role","suspend","reactivate"].includes(action))return reply({error:"Acción no disponible."},400);
 const reason=typeof body.reason==="string"?body.reason.trim():"";
 if(reason.length<12||reason.length>300)return reply({error:"Indica un motivo de 12 a 300 caracteres."},400);
 const confirmed=body.confirmation;
 const operator=auth.operator;
 if(action==="invite"){
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  if(email.length>254||!emailPattern.test(email)||confirmed!==email)return reply({error:"Confirma escribiendo exactamente el correo del destinatario."},400);
  // Fail closed if the required pre-action audit record cannot be written.
  if(!await audit(auth,"user_invite_requested","email",email,reason))return reply({error:"No se pudo preparar la auditoría de la invitación."},503);
  const {data,error}=await operator.auth.admin.inviteUserByEmail(email);
  if(error){
   await audit(auth,"user_invite_failed","email",email,"Intento fallido. "+reason);
   return reply({error:"No se pudo enviar la invitación. Revisa si el usuario ya existe o los límites de correo."},409);
  }
  const targetId=data.user?.id||email;
  const logged=await audit(auth,"user_invite_sent","account",targetId,reason);
  return reply({ok:true,message:logged?"Invitación enviada y registrada.":"Invitación enviada; el registro final requiere revisión administrativa.",audit_complete:logged});
 }
 const target=typeof body.user_id==="string"?body.user_id:"";
 if(!uuid.test(target)||target===auth.actorId)return reply({error:"La cuenta superadministradora no puede modificarse desde esta pantalla."},403);
 const {data:targetUser,error:userError}=await operator.auth.admin.getUserById(target);
 if(userError||!targetUser.user)return reply({error:"Cuenta no encontrada."},404);
 const targetEmail=targetUser.user.email?.toLowerCase()||"";
 if(!targetEmail||confirmed!==targetEmail)return reply({error:"Escribe exactamente el correo de la cuenta para confirmar."},400);
 const {data:targetRole,error:roleError}=await operator.from("platform_admin_roles")
  .select("role,is_active").eq("user_id",target).maybeSingle();
 if(roleError)return reply({error:"No fue posible comprobar el rol del usuario."},503);
 if(targetRole?.role==="super_admin")return reply({error:"Las cuentas superadministradoras están protegidas. Requieren un procedimiento especial."},403);
 if(action==="set_role"){
  const newRole=body.role;
  if(newRole!==null&&(typeof newRole!=="string"||!roleChoices.includes(newRole as typeof roleChoices[number])))
   return reply({error:"Rol no permitido."},400);
  if(!await audit(auth,"user_role_requested","account",target,"Asignación "+String(newRole)+". "+reason))
   return reply({error:"No fue posible registrar la solicitud de cambio."},503);
  let error;
  if(newRole===null){
   ({error}=await operator.from("platform_admin_roles").delete().eq("user_id",target).neq("role","super_admin"));
  }else{
   ({error}=await operator.from("platform_admin_roles").upsert({
    user_id:target,role:newRole,is_active:true,granted_by:auth.actorId,note:reason
   },{onConflict:"user_id"}));
  }
  if(error){await audit(auth,"user_role_failed","account",target,reason);return reply({error:"No se pudo actualizar el rol."},503)}
  const logged=await audit(auth,"user_role_completed","account",target,"Nuevo rol: "+String(newRole)+". "+reason);
  return reply({ok:true,audit_complete:logged,message:logged?"Rol actualizado y auditado.":"Rol actualizado; verificar registro final de auditoría."});
 }
 // Supabase ban_duration blocks future authentication. Existing access tokens can remain
 // valid until expiry; this is NOT an immediate clinical-data revocation mechanism.
 const duration=action==="suspend"?"876000h":"none";
 const {data:user,error:banReadError}=await operator.auth.admin.getUserById(target);
 if(banReadError||!user.user)return reply({error:"No se pudo verificar la cuenta."},503);
 const isBanned=Boolean(user.user.banned_until&&Date.parse(user.user.banned_until)>Date.now());
 if((action==="suspend"&&isBanned)||(action==="reactivate"&&!isBanned))return reply({error:"La cuenta ya se encuentra en ese estado."},409);
 if(!await audit(auth,"user_"+action+"_requested","account",target,reason))return reply({error:"No se pudo registrar la solicitud."},503);
 const {error:changeError}=await operator.auth.admin.updateUserById(target,{ban_duration:duration});
 if(changeError){await audit(auth,"user_"+action+"_failed","account",target,reason);return reply({error:"No fue posible actualizar el acceso."},503)}
 const logged=await audit(auth,"user_"+action+"_completed","account",target,reason);
 return reply({ok:true,audit_complete:logged,message:logged?(action==="suspend"?"Acceso suspendido para nuevas autenticaciones. Las sesiones existentes requieren control adicional.":"Acceso reactivado."):"Cambio realizado; verificar registro final de auditoría."});
}
