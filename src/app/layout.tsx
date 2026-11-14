import type { ReactNode } from "react";
import "./wellness.css";
export const metadata = {title:"WELLNESS APP | Inteligencia para tu bienestar",description:"Conoce tus indicadores, hábitos y evolución de bienestar en un solo lugar."};
export default function RootLayout({children}:{children:ReactNode}){
 return <html lang="es"><body>
 <header className="well-header"><div className="well-header-inner">
 <a className="well-brand" href="/"><span className="well-brand-mark">W</span>WELLNESS <span style={{color:"var(--well-violet)"}}>APP</span></a>
 <nav className="well-nav" aria-label="Navegación principal"><a href="/">Inicio</a><a href="/mi-bienestar">Mi bienestar</a><a href="/sprint-6-2/persistencia">Acceder</a><a href="/mi-perfil">Mi perfil</a></nav>
 </div></header>{children}
 <footer className="well-footer"><div className="well-shell"><strong style={{color:"var(--well-ink)"}}>WELLNESS APP</strong><span style={{marginLeft:14}}>Inteligencia para tu bienestar.</span></div></footer>
 </body></html>;
}
