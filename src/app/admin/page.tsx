"use client";
import {useEffect,useState} from "react";
import {createClient,type SupabaseClient} from "@supabase/supabase-js";

type State="loading"|"login"|"denied"|"mfa"|"ready"|"error";
const blocks=[
 ["Usuarios","Cuentas y operaciones"],["Profesionales","Directorio y credenciales"],
 ["Membresías y tarifas","Planes, precios y beneficios"],["Paquetes de análisis","Productos y composición"],
 ["Pruebas adicionales","Catálogo comercial"],["Promociones","Cupones y campañas"],
 ["Órdenes y pagos","Contratación y conciliación"],["Ciencia","Contenido y reglas aprobadas"],
 ["Inteligencia","Evaluaciones y configuraciones"],["Seguridad","Roles, permisos y auditoría"]];
const client=()=>{const u=process.env.NEXT_PUBLIC_SUPABASE_URL;const k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return u&&k?createClient(u,k):null};
const pane={padding:24,borderRadius:18,background:"#fff",border:"1px solid #E7E6EF"};
const btn={background:"#5B40F5",color:"#fff",border:0,borderRadius:11,padding:"12px 18px",fontWeight:700,cursor:"pointer"} as const;
export default function AdminPage(){
 const [db]=useState<SupabaseClient|null>(client);
 const [state,setState]=useState<State>("loading");
 const [role,setRole]=useState("");
 const [email,setEmail]=useState("");
 const [factor,setFactor]=useState("");
 const [qr,setQr]=useState("");
 const [code,setCode]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 async function check(){
  if(!db){setState("error");return}
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user){setState("login");return}
  setEmail(user.email||"");
  const {data:roleData,error:roleError}=await db.from("platform_admin_roles").select("role,is_active").eq("user_id",user.id).maybeSingle();
  if(roleError){setState("error");return}
  if(!roleData?.is_active){setState("denied");return}
  setRole(roleData.role);
  const {data:aal,error:aalError}=await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if(aalError){setState("error");return}
  if(aal.currentLevel==="aal2"){setState("ready");return}
  const {data:factors,error:factorsError}=await db.auth.mfa.listFactors();
  if(factorsError){setState("error");return}
  const verified=factors.totp.find(f=>f.status==="verified");
  if(verified)setFactor(verified.id);
  setState("mfa");
 }
 useEffect(()=>{void check().catch(()=>setState("error"))},[]);
 async function enroll(){
  if(!db||busy)return;
  setBusy(true);setMessage("");
  const {data,error}=await db.auth.mfa.enroll({factorType:"totp",friendlyName:"WELLNESS ADMIN"});
  if(error||!data){setMessage("No fue posible iniciar la verificación. Inténtalo nuevamente.");setBusy(false);return}
  setFactor(data.id);
  const image=data.totp.qr_code;
  setQr(image.startsWith("data:")?image:"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(image));
  setBusy(false);
 }
 async function verify(){
  if(!db||!factor||busy)return;
  if(!/^\d{6}$/.test(code.trim())){setMessage("Introduce el código de seis dígitos.");return}
  setBusy(true);setMessage("");
  const {error}=await db.auth.mfa.challengeAndVerify({factorId:factor,code:code.trim()});
  if(error){setMessage("Código incorrecto o vencido. Inténtalo de nuevo.");setBusy(false);return}
  setCode("");setQr("");setBusy(false);
  await check();
 }
 return <main style={{maxWidth:1080,margin:"0 auto",padding:"54px 22px 90px",color:"#161620"}}>
   <div style={{display:"flex",alignItems:"center",gap:12}}>
     <span style={{display:"grid",placeItems:"center",width:41,height:41,background:"#5B40F5",color:"white",fontWeight:800,borderRadius:12}}>W</span>
     <strong style={{letterSpacing:"0.08em",fontSize:12}}>WELLNESS ADMIN</strong>
   </div>
   <h1 style={{fontSize:"clamp(28px,4vw,45px)",letterSpacing:"-.04em",margin:"24px 0 10px"}}>Administración de la plataforma</h1>
   <p style={{color:"#777480",maxWidth:620,lineHeight:1.65,marginBottom:28}}>Espacio privado de administración. El acceso requiere autorización y verificación en dos pasos.</p>
   {state==="loading"&&<div style={pane} role="status">Verificando tu identidad…</div>}
   {state==="login"&&<div style={pane}><h2>Inicia sesión</h2><p>Necesitas iniciar sesión con una cuenta administrativa.</p><a href="/sprint-6-2/persistencia" style={{color:"#5B40F5"}}>Ir al acceso de mi cuenta</a></div>}
   {state==="denied"&&<div style={pane}><h2>Acceso restringido</h2><p>Esta cuenta no tiene un rol administrativo activo.</p></div>}
   {state==="error"&&<div style={pane}><h2>No se pudo confirmar el acceso</h2><p>La consola permanecerá protegida hasta verificar los permisos.</p><button style={btn} onClick={()=>void check()}>Reintentar</button></div>}
   {state==="mfa"&&<div style={{...pane,maxWidth:520}}>
    <h2 style={{marginTop:0,fontSize:21}}>Protege tu cuenta administrativa</h2>
    <p style={{fontSize:14,color:"#777480",lineHeight:1.65}}>Para entrar necesitas un código temporal de tu aplicación autenticadora. Esta medida protege las operaciones de la plataforma.</p>
    {!factor&&<button style={btn} disabled={busy} onClick={()=>void enroll()}>{busy?"Preparando…":"Configurar autenticación en dos pasos"}</button>}
    {qr&&<div style={{display:"grid",gap:12,justifyItems:"start",margin:"20px 0"}}><img alt="Código QR para configurar el autenticador" src={qr} style={{width:190,height:190,background:"#fff"}}/><p style={{fontSize:12,color:"#777480"}}>Escanea este código desde tu aplicación autenticadora.</p></div>}
    {factor&&<div style={{display:"grid",gap:10,maxWidth:340}}>
      <label htmlFor="mfa-code" style={{fontSize:13,fontWeight:700}}>Código de seis dígitos</label>
      <input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} style={{border:"1px solid #DAD8E6",borderRadius:10,padding:"12px 14px",fontSize:18,letterSpacing:4,color:"#161620"}}/>
      <button style={btn} disabled={busy} onClick={()=>void verify()}>{busy?"Verificando…":"Verificar y entrar"}</button>
    </div>}
    {message&&<p role="alert" style={{color:"#7F3D34",fontSize:13}}>{message}</p>}
   </div>}
   {state==="ready"&&<div>
    <div style={{...pane,background:"#F5F3FC",marginBottom:20}}>
      <strong>Sesión administrativa verificada</strong><p style={{margin:"7px 0",fontSize:13}}>{email}</p>
      <span style={{fontSize:12}}>Rol: {role.replaceAll("_"," ")} · MFA activado</span>
    </div>
    <p style={{color:"#777480",fontSize:13}}>Estructura operativa inicial. Los módulos de gestión se habilitarán progresivamente; no se muestran métricas ficticias ni datos médicos individuales.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginTop:18}}>
      {blocks.map(([name,description])=><article key={name} style={{...pane,minHeight:132}}>
       <div style={{width:32,height:5,borderRadius:10,background:"#5B40F5",marginBottom:14}}/>
       <strong>{name}</strong>
       <p style={{fontSize:13,color:"#777480",lineHeight:1.5}}>{description}</p>
       {name==="Usuarios"&&role==="super_admin"?<a href="/admin/usuarios" style={{fontSize:12,fontWeight:800,color:"#5B40F5",display:"inline-block",marginTop:10}}>Abrir directorio de usuarios →</a>:<span style={{fontSize:11,color:"#92909A"}}>Próxima implementación</span>}
      </article>)}
    </div>
   </div>}
   <p style={{fontSize:12,color:"#92909A",marginTop:30}}>El rol administrativo no autoriza acceso indiscriminado a datos clínicos. Las operaciones sensibles necesitarán controles adicionales en servidor y auditoría.</p>
 </main>
}
