import type { ReactNode } from "react";
import "./wellness.css";
import {AuthProvider} from "./components/WellnessAuthProvider";
import PublicAuthNav from "./components/PublicAuthNav";
export const metadata = {title:"WELLNESS APP | Inteligencia para tu bienestar",description:"Conoce tus indicadores, hábitos y evolución de bienestar en un solo lugar."};
export default function RootLayout({children}:{children:ReactNode}){
 return <html lang="es"><body><AuthProvider>
 <header className="well-header"><div className="well-header-inner">
 <a className="well-brand" href="/"><span className="well-brand-mark">W</span>WELLNESS <span style={{color:"var(--well-violet)"}}>APP</span></a>
 <PublicAuthNav/>
 </div></header>{children}
 <footer className="well-footer"><div className="well-shell"><strong style={{color:"var(--well-ink)"}}>WELLNESS APP</strong><span style={{marginLeft:14}}>Inteligencia para tu bienestar.</span></div></footer>
 </AuthProvider></body></html>;
}
