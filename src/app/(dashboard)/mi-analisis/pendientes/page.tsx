"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import "../analisis.css";
type PendingReading={id:string;original_label:string;raw_value:string;unit:string;kind:"unmapped"|"qualitative"|"complementary";collected_on:string;created_at:string};
const labels={unmapped:"Sin equivalente",qualitative:"Resultado cualitativo",complementary:"Dato complementario"} as const;
export default function PendingReadingsPage(){
 const [rows,setRows]=useState<PendingReading[]>([]);
 const [state,setState]=useState<"loading"|"signed_out"|"error"|"ready">("loading");
 useEffect(()=>{let active=true;void(async()=>{
  const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!u||!k){if(active)setState("error");return}
  const db=createClient(u,k),{data:{user},error}=await db.auth.getUser();
  if(!active)return;
  if(error||!user){setState("signed_out");return}
  const result=await db.from("lab_unmatched_readings").select("id,original_label,raw_value,unit,kind,collected_on,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(300);
  if(!active)return;
  if(result.error){setState("error");return}
  setRows((result.data||[]) as PendingReading[]);setState("ready");
 })().catch(()=>{if(active)setState("error")});return()=>{active=false}},[]);
 return <main className="wa-page">
  <a className="wa-back" href="/mi-analisis">‹ Volver a Mis análisis</a>
  <span className="wa-eyebrow">MIS ANÁLISIS · REVISIÓN PRIVADA</span>
  <h1 className="wa-title">Lecturas pendientes del laboratorio</h1>
  <p className="wa-subtitle">Aquí se conservan lecturas que no pueden convertirse con seguridad en una medición del catálogo. No están clasificadas como Óptimo, Suficiente ni Fuera de rango.</p>
  <section className="wa-explorer" style={{marginTop:16,padding:18}}>
   {state==="loading"&&<p role="status">Consultando tus lecturas…</p>}
   {state==="signed_out"&&<p role="status">Inicia sesión para consultar tus lecturas privadas. <a href="/sprint-6-2/persistencia">Iniciar sesión</a></p>}
   {state==="error"&&<p role="alert">No fue posible consultar la bandeja privada. Tus datos no se han modificado.</p>}
   {state==="ready"&&<>
    <h2 style={{fontSize:17}}>{rows.length} lecturas pendientes</h2>
    {rows.length===0?<p className="wa-subtitle" style={{marginTop:12}}>Todavía no tienes lecturas sin asociar guardadas. Puedes recuperarlas cargando el PDF original y marcando esas filas como «Pendiente».</p>:
    <div style={{overflowX:"auto",marginTop:12}}>
     <table style={{width:"100%",borderCollapse:"collapse",minWidth:640,fontSize:12}}>
      <thead><tr style={{background:"#f4f0ff"}}>{["Lectura original","Resultado","Tipo","Fecha de muestra"].map(h=><th key={h} style={{textAlign:"left",padding:12}}>{h}</th>)}</tr></thead>
      <tbody>{rows.map(r=><tr key={r.id} style={{borderBottom:"1px solid #ece7f7"}}>
       <td style={{padding:12,fontWeight:700}}>{r.original_label}</td>
       <td style={{padding:12}}>{r.raw_value} {r.unit}</td>
       <td style={{padding:12}}><span className="wa-result-status wa-display-pending">{labels[r.kind]}</span></td>
       <td style={{padding:12}}>{r.collected_on}</td>
      </tr>)}</tbody>
     </table>
    </div>}
   </>}
  </section>
 </main>
}
