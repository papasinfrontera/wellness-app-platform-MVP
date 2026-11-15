"use client";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {useWellnessAuth} from "../components/WellnessAuthProvider";
import "./dashboard.css";
const nav=[
 {label:"Mi bienestar",path:"/mi-bienestar",symbol:"▦"},
 {label:"Mis análisis",path:"/mi-analisis",symbol:"◇"},
 {label:"Dispositivos",path:"/dispositivos",symbol:"◷"},
 {label:"Hábitos",path:"/habitos",symbol:"◎"},
 {label:"Inteligencia",path:"/inteligencia",symbol:"✳"},
 {label:"Doctor Connect",path:"/doctor-connect",symbol:"✚"}
];
function AccountMenu(){
 const {identity,user,status,signOut,refreshAuth}=useWellnessAuth();
 const router=useRouter();
 const path=usePathname();
 const menu=useRef<HTMLDetailsElement>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [photoFailed,setPhotoFailed]=useState(false);
 useEffect(()=>{if(menu.current)menu.current.open=false;setMessage("");setPhotoFailed(false)},[path,identity.avatarUrl]);
 useEffect(()=>{
  const close=(event:PointerEvent)=>{if(menu.current&&!menu.current.contains(event.target as Node))menu.current.open=false};
  const keyClose=(event:KeyboardEvent)=>{
    if(event.key==="Escape"&&menu.current?.open){
      menu.current.open=false;
      menu.current.querySelector("summary")?.focus();
    }
  };
  document.addEventListener("pointerdown",close);
  document.addEventListener("keydown",keyClose);
  return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",keyClose)};
 },[]);
 if(status==="loading")return <span className="wb-session-wait" role="status">Comprobando sesión…</span>;
 if(status==="error")return <button type="button" className="wb-session-retry" onClick={()=>void refreshAuth()}>Reintentar sesión</button>;
 if(status!=="signed_in"||!user)return <a href="/sprint-6-2/persistencia" className="wb-auth-link">Iniciar sesión</a>;
 const name=identity.firstName||user.email?.split("@")[0]||"Mi cuenta";
 const initials=(identity.firstName.charAt(0)+identity.lastName.charAt(0)).trim().toUpperCase()||name.slice(0,2).toUpperCase();
 async function logout(){
  if(busy)return;setBusy(true);setMessage("");
  const success=await signOut();
  setBusy(false);
  if(success){if(menu.current)menu.current.open=false;router.replace("/sprint-6-2/persistencia");router.refresh()}
  else setMessage("No se pudo cerrar sesión. Inténtalo nuevamente.");
 }
 return <div className="wb-account">
   <span className="wb-session-live"><span className="wb-session-dot" aria-hidden="true"/>Conectado</span>
   <details ref={menu} className="wb-account-details">
    <summary className="wb-account-trigger" aria-label={"Cuenta de "+name+". Abrir menú"}>
      <span className="wb-avatar">
       {identity.avatarUrl&&!photoFailed?<img src={identity.avatarUrl} alt="" onError={()=>setPhotoFailed(true)} className="wb-avatar-img"/>:<span aria-hidden="true">{initials}</span>}
      </span>
      <span className="wb-account-ident"><strong>{name}</strong><small>Mi cuenta</small></span>
      <span className="wb-account-chevron" aria-hidden="true">⌄</span>
    </summary>
    <div className="wb-account-popover" role="group" aria-label="Opciones de cuenta">
      <div className="wb-account-popover-head">
        <strong>{[identity.firstName,identity.lastName].filter(Boolean).join(" ")||name}</strong>
        <small>Sesión activa</small>
      </div>
      <a href="/mi-perfil" className="wb-account-option">◉ <span>Mi perfil</span></a>
      <a href="/mi-perfil?seccion=1" className="wb-account-option">⚙ <span>Configuración del perfil</span></a>
      <a href="/mi-perfil?seccion=5" className="wb-account-option">♧ <span>Privacidad y permisos</span></a>
      <div className="wb-account-rule"/>
      <button type="button" disabled={busy} onClick={()=>void logout()} className="wb-account-option wb-account-logout">↪ <span>{busy?"Cerrando sesión…":"Cerrar sesión"}</span></button>
      {message&&<p role="alert" className="wb-account-message">{message}</p>}
    </div>
   </details>
 </div>;
}
export default function DashboardLayout({children}:{children:ReactNode}){
 const path=usePathname();
 const {status,refreshAuth}=useWellnessAuth();
 const [collapsed,setCollapsed]=useState(false);
 useEffect(()=>{try{setCollapsed(window.localStorage.getItem("wellness-sidebar-collapsed")==="1")}catch{}},[]);
 function toggleSidebar(){setCollapsed(prev=>{const next=!prev;try{window.localStorage.setItem("wellness-sidebar-collapsed",next?"1":"0")}catch{}return next})}
 return <div className={"wb-app"+(collapsed?" wb-collapsed":"")}>
  <aside className="wb-sidebar" aria-label="Navegación de bienestar">
   <div className="wb-sidebar-heading"><a href="/mi-bienestar" className="wb-logo" title="WELLNESS APP"><span className="wb-logo-mark">W</span><span className="wb-logo-text">WELLNESS <b>APP</b></span></a><button type="button" className="wb-sidebar-toggle" aria-expanded={!collapsed} aria-controls="wellness-main-navigation" aria-label={collapsed?"Expandir menú lateral":"Contraer menú lateral"} title={collapsed?"Expandir menú":"Contraer menú"} onClick={toggleSidebar}>{collapsed?"☰":"‹"}</button></div>
   <p className="wb-sidebar-label">TU ESPACIO</p>
   <nav id="wellness-main-navigation" className="wb-navigation" aria-label="Secciones principales">
    {nav.map(item=><a key={item.path} title={item.label} aria-label={item.label} aria-current={path===item.path?"page":undefined} className={"wb-nav-link"+(path===item.path?" wb-selected":"")} href={item.path}><span aria-hidden="true" className="wb-nav-symbol">{item.symbol}</span><span className="wb-nav-text">{item.label}</span>{item.label==="Doctor Connect"&&<span className="wb-future-dot" title="Próximamente"/>}</a>)}
   </nav>
   <div className="wb-sidebar-bottom"><a className="wb-nav-link" aria-label="Mi cuenta y ajustes" title="Mi cuenta y ajustes" href="/mi-perfil"><span className="wb-nav-symbol">⚙</span><span className="wb-nav-text">Mi cuenta y ajustes</span></a><p>Inteligencia para tu bienestar.</p></div>
  </aside>
  <div className="wb-workspace">
   <header className="wb-topbar"><a className="wb-topbar-logo" href="/mi-bienestar">WELLNESS APP</a><div className="wb-topbar-side"><AccountMenu/></div></header>
   <div className="wb-view">
    {status==="signed_in"?children:
      <section className="wb-state" role="status">
       {status==="loading"?<p>Verificando tu sesión privada…</p>:status==="error"?<><h2>No se pudo verificar la sesión</h2><button type="button" className="wb-auth-link" onClick={()=>void refreshAuth()}>Reintentar</button></>:
       <><h2>Accede a tu espacio de bienestar</h2><p>Inicia sesión para consultar tus análisis y datos personales.</p><a className="wb-auth-link" href="/sprint-6-2/persistencia">Iniciar sesión</a></>}
      </section>}
   </div>
   <footer className="wb-bottom">WELLNESS APP · Inteligencia para tu bienestar.</footer>
  </div>
 </div>;
}
