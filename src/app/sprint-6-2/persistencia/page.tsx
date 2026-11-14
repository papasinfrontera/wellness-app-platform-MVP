"use client";
import { useEffect, useState } from "react";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type SampleRecord = {id:string;label:string;value:number;unit:string;created_at:string};
function getClient():SupabaseClient|null {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return url&&key?createClient(url,key):null;
}
const inputHint="Usa una contraseña de al menos ocho caracteres.";
export default function MiEspacio(){
 const [db]=useState(getClient);
 const [user,setUser]=useState<User|null>(null);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [showPassword,setShowPassword]=useState(false);
 const [mode,setMode]=useState<"signin"|"signup">("signin");
 const [records,setRecords]=useState<SampleRecord[]>([]);
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const [loadingSession,setLoadingSession]=useState(true);
 useEffect(()=>{
  if(!db){setLoadingSession(false);return}
  let alive=true;
  void db.auth.getUser().then(({data})=>{if(alive){setUser(data.user);setLoadingSession(false)}}).catch(()=>{if(alive)setLoadingSession(false)});
  const {data:auth}=db.auth.onAuthStateChange((_event,session)=>{if(alive){setUser(session?.user??null);setLoadingSession(false)}});
  return ()=>{alive=false;auth.subscription.unsubscribe()};
 },[db]);
 useEffect(()=>{
  if(!db||!user){setRecords([]);return}
  let alive=true;
  void db.from("demo_measurements").select("id,label,value,unit,created_at").order("created_at",{ascending:false}).limit(20)
  .then(({data,error})=>{if(!alive)return;if(error)setNotice("No fue posible mostrar tus registros. Inténtalo nuevamente.");else setRecords((data??[]) as SampleRecord[])});
  return ()=>{alive=false};
 },[db,user]);
 async function authenticate(){
  if(!db||busy||!email.includes("@")||password.length<8)return;
  setBusy(true);setNotice("");
  try{
   const response=mode==="signup"
    ?await db.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin+"/sprint-6-2/persistencia"}})
    :await db.auth.signInWithPassword({email:email.trim(),password});
   if(response.error)throw response.error;
   setPassword("");
   setNotice(response.data.session?"¡Bienvenido a tu espacio!":mode==="signup"?"Revisa tu correo y confirma el enlace para activar tu cuenta.":"Si acabas de registrarte, confirma tu correo para acceder.");
  }catch(e){
   const raw=e instanceof Error?e.message:"";
   setNotice(/rate limit|too many requests/i.test(raw)?"Se han realizado demasiados intentos. Inténtalo de nuevo más tarde.":/invalid login|invalid credentials/i.test(raw)?"No pudimos iniciar sesión. Revisa tu correo y contraseña.":"No fue posible completar el acceso. Inténtalo nuevamente.");
  }finally{setBusy(false)}
 }
 async function addSample(){
  if(!db||!user||busy)return;
  setBusy(true);setNotice("");
  const {error}=await db.from("demo_measurements").insert({user_id:user.id,label:"Ejemplo",value:42,unit:"demo"});
  if(error)setNotice("No se pudo guardar el ejemplo. Inténtalo nuevamente.");
  else{
   const {data,error:readError}=await db.from("demo_measurements").select("id,label,value,unit,created_at").order("created_at",{ascending:false}).limit(20);
   if(!readError)setRecords((data??[]) as SampleRecord[]);
   setNotice("Ejemplo guardado correctamente.");
  }
  setBusy(false);
 }
 async function removeSample(id:string){
  if(!db||busy)return;
  setBusy(true);setNotice("");
  const {error}=await db.from("demo_measurements").delete().eq("id",id);
  if(error)setNotice("No se pudo eliminar este registro.");
  else{setRecords(items=>items.filter(item=>item.id!==id));setNotice("Registro eliminado.");}
  setBusy(false);
 }
 async function signOut(){
  if(!db||busy)return;
  setBusy(true);
  const {error}=await db.auth.signOut();
  if(error)setNotice("No fue posible cerrar sesión.");else{setRecords([]);setNotice("");}
  setBusy(false);
 }
 return <main className="well-shell">
 <div className="well-signin">
 <div style={{marginBottom:30}}><span className="well-eyebrow">Mi bienestar</span>
 <h1 className="well-title" style={{fontSize:"clamp(32px,5vw,48px)",margin:"12px 0 14px"}}>{user?"Tu espacio personal.":"Bienvenido a WELLNESS APP."}</h1>
 <p className="well-subtitle" style={{margin:0}}>{user?"Tus datos, organizados para acompañarte en cada etapa.":"Ingresa a tu espacio y comienza a conocer tu bienestar."}</p></div>
 {!db?<div className="well-card well-signin-card"><p>El acceso no está disponible en este momento.</p></div>
 :loadingSession?<div className="well-card well-signin-card"><p>Cargando tu espacio…</p></div>
 :!user?
 <section className="well-card well-signin-card">
 <div className="well-auth-tabs" role="tablist" aria-label="Acceso">
 <button type="button" role="tab" aria-selected={mode==="signin"} className={mode==="signin"?"active":""} onClick={()=>{setMode("signin");setNotice("");}}>Iniciar sesión</button>
 <button type="button" role="tab" aria-selected={mode==="signup"} className={mode==="signup"?"active":""} onClick={()=>{setMode("signup");setNotice("");}}>Crear cuenta</button>
 </div>
 <form onSubmit={e=>{e.preventDefault();void authenticate()}} style={{display:"grid",gap:19}}>
 <label className="well-field">Correo electrónico
 <input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="tu@correo.com" required/></label>
 <label className="well-field">Contraseña
 <input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
 autoComplete={mode==="signup"?"new-password":"current-password"} minLength={8} required placeholder="Mínimo 8 caracteres"/></label>
 <label style={{display:"flex",gap:9,alignItems:"center",fontSize:13,color:"var(--well-muted)"}}><input type="checkbox" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)}/> Mostrar contraseña</label>
 {mode==="signup"&&<p style={{margin:"-8px 0 0",fontSize:12,color:"var(--well-muted)"}}>{inputHint}</p>}
 <button type="submit" className="well-button" disabled={busy||!email.includes("@")||password.length<8}>{busy?"Un momento…":mode==="signin"?"Entrar a mi espacio":"Crear mi cuenta"}</button>
 </form>
 </section>
 :<section className="well-card well-signin-card">
 <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"center",justifyContent:"space-between"}}>
 <div><span className="well-eyebrow">Mi cuenta</span><p style={{fontSize:14,margin:"9px 0",overflowWrap:"anywhere",color:"var(--well-muted)"}}>{user.email}</p></div>
 <button className="well-button-secondary" onClick={()=>void signOut()} disabled={busy}>Cerrar sesión</button>
 </div>
 <div style={{height:1,background:"var(--well-line)",margin:"24px 0"}}/>
 <div style={{display:"flex",alignItems:"start",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
 <div><h2 style={{fontSize:22,letterSpacing:"-.02em",margin:"0 0 5px"}}>Mis registros</h2>
 <p style={{color:"var(--well-muted)",fontSize:13,margin:"0 0 19px"}}>Conoce cómo se presenta tu información en este espacio.</p></div>
 <span className="well-tag">Datos de ejemplo</span></div>
 <button className="well-button" disabled={busy} onClick={()=>void addSample()}>Agregar ejemplo</button>
 <div style={{marginTop:21}}>
 {records.length===0?<div className="well-empty"><div style={{fontSize:25,color:"var(--well-violet)",marginBottom:10}}>◇</div><strong style={{display:"block",color:"var(--well-ink)",marginBottom:5}}>Aún no hay registros</strong>Los registros que agregues aparecerán aquí.</div>
 :records.map(record=><div key={record.id} style={{borderBottom:"1px solid var(--well-line)",padding:"15px 0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:15}}>
 <div><strong style={{fontSize:20}}>{record.value} <span style={{fontSize:13,fontWeight:400,color:"var(--well-muted)"}}>{record.unit}</span></strong>
 <p style={{margin:"4px 0 0",fontSize:12,color:"var(--well-muted)"}}>Ejemplo · {new Date(record.created_at).toLocaleDateString("es",{day:"2-digit",month:"short",year:"numeric"})}</p></div>
 <button type="button" disabled={busy} onClick={()=>void removeSample(record.id)} className="well-button-secondary" style={{minHeight:36,padding:"7px 12px",fontSize:12}}>Eliminar</button></div>)}
 </div>
 </section>}
 {notice&&<p className="well-info" role="status" aria-live="polite">{notice}</p>}
 </div>
 </main>;
}
