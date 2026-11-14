"use client";
import {usePathname} from "next/navigation";
import type {ReactNode} from "react";
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
 return <div className="wb-app">
  <aside className="wb-sidebar" aria-label="Navegación de bienestar">
   <a href="/mi-bienestar" className="wb-logo"><span className="wb-logo-mark">W</span><span>WELLNESS <b>APP</b></span></a>
   <p className="wb-sidebar-label">TU ESPACIO</p>
   <nav className="wb-navigation" aria-label="Secciones principales">
    {nav.map(item=><a key={item.path} aria-current={path===item.path?"page":undefined} className={"wb-nav-link"+(path===item.path?" wb-selected":"")} href={item.path}><span aria-hidden="true" className="wb-nav-symbol">{item.symbol}</span><span>{item.label}</span>{item.label==="Doctor Connect"&&<span className="wb-future-dot" title="Próximamente"/>}</a>)}
   </nav>
   <div className="wb-sidebar-bottom"><a className="wb-nav-link" href="/mi-perfil"><span className="wb-nav-symbol">⚙</span><span>Mi cuenta y ajustes</span></a><p>Inteligencia para tu bienestar.</p></div>
  </aside>
  <div className="wb-workspace">
   <header className="wb-topbar"><a className="wb-topbar-logo" href="/mi-bienestar">WELLNESS APP</a><div className="wb-topbar-side"><a href="/mi-perfil" className="wb-topbar-profile">Mi perfil <span aria-hidden="true">↗</span></a></div></header>
   <div className="wb-view">{children}</div>
   <footer className="wb-bottom">WELLNESS APP · Inteligencia para tu bienestar.</footer>
  </div>
 </div>
}
