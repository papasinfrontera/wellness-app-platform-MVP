"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {useWellnessAuth} from "../components/WellnessAuthProvider";
export default function RestablecerContrasena(){
 const {client,user,recoveryMode,clearRecovery,refreshAuth}=useWellnessAuth();
 const router=useRouter();
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [show,setShow]=useState(false);
 const valid=password.length>=8&&password===confirm;
 useEffect(()=>{
  if(!client)return;
  // In a PKCE redirect Supabase processes the one-time code, then fires PASSWORD_RECOVERY.
  // The shared auth provider remembers this event if it occurred before this page mounted.
  const {data:listener}=client.auth.onAuthStateChange(event=>{
   if(event==="PASSWORD_RECOVERY")setNotice("");
  });
  return()=>listener.subscription.unsubscribe();
 },[client]);
 async function change(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!client||!user||!recoveryMode||!valid||busy)return;
  setBusy(true);setNotice("");
  try{
   const {error}=await client.auth.updateUser({password});
   if(error)throw error;
   setPassword("");setConfirm("");clearRecovery();
   await refreshAuth();
   router.replace("/mi-bienestar");router.refresh();
  }catch{setNotice("No fue posible actualizar tu contraseña. Solicita un nuevo enlace si ha vencido.");}
  finally{setBusy(false)}
 }
 return <main className="well-shell" style={{maxWidth:560,paddingTop:55,paddingBottom:75}}>
  <span className="well-eyebrow">Seguridad de mi cuenta</span>
  <h1 className="well-title" style={{fontSize:36}}>Establece una nueva contraseña</h1>
  <section className="well-card" style={{padding:25,marginTop:20}}>
   {!recoveryMode?<><p>Para cambiar la contraseña desde aquí, abre el enlace de recuperación que recibiste por correo.</p><a className="well-link" href="/sprint-6-2/persistencia">Volver al acceso</a></>:
   <form onSubmit={e=>{void change(e)}} style={{display:"grid",gap:17}}>
    <label className="well-field">Nueva contraseña<input type={show?"text":"password"} autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <label className="well-field">Confirma la nueva contraseña<input type={show?"text":"password"} autoComplete="new-password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
    <label style={{fontSize:13,display:"flex",gap:8}}><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/> Mostrar contraseña</label>
    <button className="well-button" type="submit" disabled={!user||!valid||busy}>{busy?"Actualizando…":"Guardar nueva contraseña"}</button>
   </form>}
   {notice&&<p role="alert" className="well-info">{notice}</p>}
  </section>
 </main>;
}
