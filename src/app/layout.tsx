import type { ReactNode } from "react";
export const metadata = { title: "WELLNESS APP · Fundación", description: "Inteligencia para tu bienestar" };
export default function RootLayout({children}:{children:ReactNode}) {return <html lang="es"><body style={{margin:0,background:"#fbfaff",color:"#191732",fontFamily:"Arial, sans-serif"}}>{children}</body></html>}
