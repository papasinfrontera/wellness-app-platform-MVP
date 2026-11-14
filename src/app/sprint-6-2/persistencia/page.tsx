"use client";
import { useEffect, useState } from "react";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type Item = { id:string; label:string; value:number; unit:string; created_at:string };
function client(): SupabaseClient | null {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url&&key?createClient(url,key):null;
}
export default function PersistenciaDemo(){
 const [db]=useState(client);
 const [user,setUser]=useState<User|null>(null);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [message,setMessage]=useState("Inicia sesión para probar registros ficticios.");
 const [records,setRecords]=useState<Item[]>([]);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!db)return;
  db.auth.getUser().then(({data,error})=>{if(!error)setUser(data.user)});
  const {data:sub}=db.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));
  return ()=>sub.subscription.unsubscribe();
 },[db]);
 useEffect(()=>{
  if(!db||!user){setRecords([]);return}
  void db.from("demo_measurements").select("id,label,value,unit,created_at").order("created_at",{ascending:false}).limit(20)
  .then(({data,error})=>{if(error)setMessage("No se pudo cargar: "+error.message);else setRecords((data??[]) as Item[])});
 },[db,user]);
 async function login(mode:"signin"|"signup"){
  if(!db||busy)return;
  setBusy(true);
  try{
   const action=mode==="signup"?db.auth.signUp({email,password}):db.auth.signInWithPassword({email,password});
   const {data,error}=await action;
   if(error)throw error;
   setMessage(data.session?"Sesión iniciada. Solo verás tus registros.":"Revisa tu correo para confirmar la cuenta y vuelve a iniciar sesión.");
  }catch(e){setMessage(e instanceof Error?e.message:"Error de autenticación")}finally{setBusy(false)}
 }
 async function saveTest(){
  if(!db||!user||busy)return;
  setBusy(true);
  const {error}=await db.from("demo_measurements").insert({user_id:user.id,label:"TEST SINTÉTICO (NO CLÍNICO)",value:42,unit:"demo"});
  if(error)setMessage("Error al guardar: "+error.message);
  else{
   setMessage("Prueba guardada en PostgreSQL. Puedes recargar la página para comprobar su persistencia.");
   const r=await db.from("demo_measurements").select("id,label,value,unit,created_at").order("created_at",{ascending:false}).limit(20);
   if(r.data)setRecords(r.data as Item[]);
  }
  setBusy(false);
 }
 async function remove(id:string){
  if(!db||busy)return;
  setBusy(true);
  const {error}=await db.from("demo_measurements").delete().eq("id",id);
  if(error)setMessage(error.message);
  else setRecords(old=>old.filter(x=>x.id!==id));
  setBusy(false);
 }
 const input={width:"100%",boxSizing:"border-box" as const,border:"1px solid #dcd7ea",padding:12,borderRadius:10,fontSize:15};
 return <main style={{maxWidth:750,margin:"auto",padding:"45px 20px 100px",lineHeight:1.55}}>
 <a href="/sprint-6-2" style={{color:"#6845eb"}}>← Sprint 6.2</a>
 <p style={{fontSize:12,letterSpacing:2,color:"#6944e8",fontWeight:800,marginTop:36}}>WELLNESS APP · PERSISTENCIA</p>
 <h1 style={{fontSize:"clamp(29px,5vw,42px)",lineHeight:1.15}}>Tu información, protegida y disponible.</h1>
 <p style={{color:"#696477"}}>Prueba técnica exclusiva para registros ficticios. No subas aquí resultados médicos ni contraseñas de otras plataformas.</p>
 {!db?<p>Falta configurar Supabase en Vercel.</p>:!user?
 <section style={{border:"1px solid #e5e0f2",borderRadius:16,padding:22,background:"#fff",display:"grid",gap:12}}>
 <h2 style={{margin:0,fontSize:22}}>Accede a tu cuenta de prueba</h2>
 <label>Correo electrónico<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} style={input}/></label>
 <label>Contraseña<input type="password" autoComplete="current-password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} style={input}/></label>
 <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
 <button disabled={busy||!email||password.length<8} onClick={()=>void login("signin")} style={{padding:"12px 18px",border:0,borderRadius:10,background:"#6944e8",color:"white",cursor:"pointer"}}>Entrar</button>
 <button disabled={busy||!email||password.length<8} onClick={()=>void login("signup")} style={{padding:"12px 18px",border:"1px solid #6944e8",borderRadius:10,background:"white",color:"#6944e8",cursor:"pointer"}}>Crear cuenta de prueba</button>
 </div>
 </section>:
 <section style={{border:"1px solid #e5e0f2",borderRadius:16,padding:22,background:"#fff"}}>
 <p style={{fontSize:13,color:"#737086"}}>Cuenta autenticada: {user.email??"Sesión activa"}</p>
 <button onClick={()=>void saveTest()} disabled={busy} style={{padding:"13px 20px",background:"#6944e8",border:0,color:"white",borderRadius:11,cursor:"pointer"}}>Guardar medición ficticia de 42 demo</button>
 <button onClick={()=>void db.auth.signOut()} style={{padding:"13px 17px",border:0,color:"#6944e8",background:"transparent",cursor:"pointer"}}>Cerrar sesión</button>
 <h2 style={{fontSize:19,marginTop:25}}>Registros guardados</h2>
 {records.length===0?<p>Aún no hay registros ficticios.</p>:records.map(r=><div key={r.id} style={{display:"flex",justifyContent:"space-between",gap:10,padding:"12px 0",borderBottom:"1px solid #eee8f5"}}>
 <span><strong>{r.value} {r.unit}</strong><div style={{fontSize:12,color:"#777"}}>{r.label} · {new Date(r.created_at).toLocaleString("es")}</div></span>
 <button disabled={busy} onClick={()=>void remove(r.id)} style={{border:0,background:"transparent",color:"#8555ca",cursor:"pointer"}}>Borrar</button></div>)}
 </section>}
 <p aria-live="polite" style={{background:"#f1effb",padding:14,borderRadius:10,fontSize:13}}>{message}</p>
 <p style={{fontSize:12,color:"#777"}}>La validación entre dos cuentas diferentes y la configuración final de correo de Supabase se comprobarán antes de utilizar información real.</p>
 </main>;
}
