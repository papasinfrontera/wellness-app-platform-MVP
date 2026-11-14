"use client";
import {usePathname} from "next/navigation";
import {useEffect,useState,type ReactNode} from "react";
import "./dashboard.css";
const nav=[
{label:"Mi bienestar",path:"/mi-bienestar",symbol:"▦"},
{label:"Mis análisis",path:"/mi-analisis",symbol:"◇"},
{label:"Dispositivos",path:"/dispositivos",symbol:"◷"},
{label:"Hábitos",path:"/habitos",symbol:"◎"},
{label:"Inteligencia",path:"/inteligencia",symbol:"✳"},
{label:"Doctor Connect",path:"/doctor-connect",symbol:"✚"}
];
export default function DashboardLayout({children}:{children:ReactNode}){
 const path=usePathname();
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
   <header className="wb-topbar"><a className="wb-topbar-logo" href="/mi-bienestar">WELLNESS APP</a><div className="wb-topbar-side"><a href="/mi-perfil" className="wb-topbar-profile">Mi perfil <span aria-hidden="true">↗</span></a></div></header>
   <div className="wb-view">{children}</div>
   <footer className="wb-bottom">WELLNESS APP · Inteligencia para tu bienestar.</footer>
  </div>
 </div>
}
