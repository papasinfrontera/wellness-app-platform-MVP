"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {useWellnessAuth} from "../../components/WellnessAuthProvider";

type Mode="signin"|"signup"|"recover";
export default function Acceso(){
 const {client:db,user,status,refreshAuth,signOut}=useWellnessAuth();
 const router=useRouter();
 const [mode,setMode]=useState<Mode>("signin");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [visible,setVisible]=useState(false);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
 async function submit(event:React.FormEvent<HTMLFormElement>){
   event.preventDefault();
   if(!db||busy||!validEmail||(mode!=="recover"&&password.length<8))return;
   setBusy(true);setNotice("");
   try{
     if(mode==="recover"){
       const {error}=await db.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/restablecer-contrasena"});
       if(error)throw error;
       setNotice("Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.");
     }else{
       const response=mode==="signup"
        ?await db.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin+"/sprint-6-2/persistencia"}})
        :await db.auth.signInWithPassword({email:email.trim(),password});
       if(response.error)throw response.error;
       setPassword("");
       if(response.data.session){await refreshAuth();router.replace("/mi-bienestar");router.refresh();return}
       setNotice(mode==="signup"?"Revisa tu correo y confirma tu cuenta para acceder.":"Comprueba tu correo para completar el acceso.");
     }
   }catch(error){
     const raw=error instanceof Error?error.message:"";
     setNotice(/rate limit|too many requests/i.test(raw)?"Se han realizado demasiados intentos. Inténtalo más tarde.":mode==="recover"?"No se pudo enviar el enlace. Inténtalo más tarde.":/invalid login|invalid credentials/i.test(raw)?"No pudimos iniciar sesión. Revisa tus datos.":"No fue posible completar la solicitud. Inténtalo de nuevo.");
   }finally{setBusy(false)}
 }
 async function leaveAccount(){
   if(busy)return;
   setBusy(true);setNotice("");
   try{
     const success=await signOut();
     if(!success){setNotice("No se pudo cerrar sesión. Inténtalo nuevamente.");return}
     setPassword("");setMode("signin");router.replace("/sprint-6-2/persistencia");router.refresh();
   }finally{setBusy(false)}
 }
 function changeMode(next:Mode){setMode(next);setNotice("");setPassword("");}
 return <main className="well-shell" style={{maxWidth:980,paddingTop:44,paddingBottom:75}}>
  <div className="well-signin" style={{maxWidth:480,margin:"0 auto"}}>
   <span className="well-eyebrow">WELLNESS APP · Mi cuenta</span>
   <h1 className="well-title" style={{fontSize:"clamp(30px,5vw,43px)",margin:"12px 0"}}>{mode==="recover"?"Recupera tu acceso":mode==="signup"?"Crea tu espacio":"Bienvenido a tu bienestar"}</h1>
   <p className="well-subtitle" style={{margin:"0 0 26px"}}>{mode==="recover"?"Te enviaremos un enlace privado para establecer una nueva contraseña.":mode==="signup"?"Comienza a organizar tu bienestar en un espacio privado.":"Accede a tus indicadores, hábitos e historial personal."}</p>
   {status==="loading"?<div className="well-card" role="status" style={{padding:22}}>Comprobando sesión…</div>:
    user?<div className="well-card" style={{padding:24,display:"grid",gap:13}}>
      <strong>Tu sesión está activa.</strong><p style={{margin:0,color:"var(--well-muted)",fontSize:13}}>Ya puedes continuar con tu espacio personal.</p>
      <a className="well-button" href="/mi-bienestar" style={{textAlign:"center",textDecoration:"none"}}>Ir a Mi bienestar</a>
      <a className="well-link" href="/mi-perfil">Consultar mi perfil</a>
      <button type="button" className="well-button-secondary" disabled={busy} onClick={()=>void leaveAccount()}>{busy?"Cerrando sesión…":"Cerrar sesión y acceder con otra cuenta"}</button>
    </div>:
    <section className="well-card well-signin-card">
     {mode!=="recover"&&<div className="well-auth-tabs" role="group" aria-label="Acceso">
      <button type="button" aria-pressed={mode==="signin"} className={mode==="signin"?"active":""} onClick={()=>changeMode("signin")}>Iniciar sesión</button>
      <button type="button" aria-pressed={mode==="signup"} className={mode==="signup"?"active":""} onClick={()=>changeMode("signup")}>Crear cuenta</button>
     </div>}
     <form onSubmit={e=>{void submit(e)}} style={{display:"grid",gap:17}}>
      <label className="well-field">Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com"/></label>
      {mode!=="recover"&&<label className="well-field">Contraseña
       <input type={visible?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required autoComplete={mode==="signup"?"new-password":"current-password"} placeholder="Mínimo 8 caracteres"/>
      </label>}
      {mode!=="recover"&&<label style={{display:"flex",gap:8,alignItems:"center",fontSize:12,color:"var(--well-muted)"}}><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/> Mostrar contraseña</label>}
      <button type="submit" className="well-button" disabled={busy||!validEmail||(mode!=="recover"&&password.length<8)}>{busy?"Procesando…":mode==="recover"?"Enviar enlace de recuperación":mode==="signup"?"Crear mi cuenta":"Entrar a mi espacio"}</button>
      {mode==="signin"&&<button type="button" className="well-link" style={{border:0,background:"none",cursor:"pointer",fontSize:13}} onClick={()=>changeMode("recover")}>¿Olvidaste tu contraseña?</button>}
      {mode==="recover"&&<button type="button" className="well-link" style={{border:0,background:"none",cursor:"pointer",fontSize:13}} onClick={()=>changeMode("signin")}>Volver a iniciar sesión</button>}
     </form>
    </section>}
   {notice&&<p role="status" aria-live="polite" className="well-info">{notice}</p>}
   <p style={{fontSize:12,color:"var(--well-muted)",marginTop:20,textAlign:"center"}}>Tu información personal se conserva en un entorno privado.</p>
  </div>
 </main>;
}
