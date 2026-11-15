"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import "../analisis.css";

type Manifest={
 id:string;sha256:string;sample_date:string;original_filename:string;lab_name:string|null;
 reviewed_count:number;confirmed_count:number;pending_count:number;excluded_count:number;created_at:string;
};
type Observation={observed_at:string;source_key:string|null;indicator_id:string};
type Row={date:string;filename:string;lab:string;reviewed:number|null;confirmed:number|null;pending:number|null;excluded:number|null;measurementCount:number;source:"manifest"|"legacy";sha:string|null;created_at:string|null};
function formatDate(day:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return day;const [y,m,d]=day.split("-");return d+"/"+m+"/"+y;}
export default function DocumentHistory(){
 const [state,setState]=useState<"loading"|"signed_out"|"ready"|"error">("loading");
 const [rows,setRows]=useState<Row[]>([]);
 useEffect(()=>{let live=true;void(async()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){if(live)setState("error");return;}
  const db=createClient(url,key);
  const {data:{user},error:authError}=await db.auth.getUser();
  if(!live)return;
  if(authError||!user){setState("signed_out");return;}
  const [manifest,history]=await Promise.all([
   db.from("lab_import_manifest").select("id,sha256,sample_date,original_filename,lab_name,reviewed_count,confirmed_count,pending_count,excluded_count,created_at")
    .eq("user_id",user.id).order("sample_date",{ascending:false}).limit(300),
   db.from("observations").select("observed_at,source_key,indicator_id")
    .eq("user_id",user.id).eq("origin","laboratory").eq("status","approved").limit(2000)
  ]);
  if(!live)return;
  if(manifest.error||history.error){setState("error");return;}
  const manifests=(manifest.data||[]) as Manifest[];
  const observations=(history.data||[]) as Observation[];
  const matched=new Set<string>();
  const output:Row[]=manifests.map(m=>{
   const relevant=observations.filter(o=>{
    const sameDate=o.observed_at.slice(0,10)===m.sample_date;
    const sameFingerprint=o.source_key?.startsWith(m.sha256+":")||false;
    if(sameDate&&sameFingerprint){matched.add(o.source_key||"");return true;}
    return false;
   });
   return {date:m.sample_date,filename:m.original_filename,lab:m.lab_name||"No indicado",reviewed:m.reviewed_count,confirmed:m.confirmed_count,pending:m.pending_count,excluded:m.excluded_count,measurementCount:relevant.length,source:"manifest",sha:m.sha256,created_at:m.created_at};
  });
  const legacy=new Map<string,number>();
  observations.forEach(o=>{
   if(matched.has(o.source_key||""))return;
   const d=o.observed_at.slice(0,10);
   legacy.set(d,(legacy.get(d)||0)+1);
  });
  legacy.forEach((count,date)=>output.push({date,filename:"Archivo anterior no registrado",lab:"No disponible",reviewed:null,confirmed:null,pending:null,excluded:null,measurementCount:count,source:"legacy",sha:null,created_at:null}));
  output.sort((a,b)=>b.date.localeCompare(a.date));
  setRows(output);setState("ready");
 })().catch(()=>{if(live)setState("error")});return()=>{live=false};},[]);
 return <main className="wa-page" style={{maxWidth:1300,margin:"0 auto"}}>
   <a href="/mi-analisis" className="wa-back">‹ Volver a Mis análisis</a>
   <span className="wa-eyebrow">MIS ANÁLISIS · PROCEDENCIA</span>
   <h1 className="wa-title">Historial de archivos y laboratorios</h1>
   <p className="wa-subtitle">Cada nueva importación aprobada registra la fecha de toma, el nombre del archivo y el laboratorio si lo indicaste. Por privacidad, el documento PDF original no se almacena en este piloto.</p>
   <section className="wa-explorer" style={{marginTop:17,padding:18}}>
    {state==="loading"&&<p role="status">Consultando el historial privado…</p>}
    {state==="signed_out"&&<p role="status">Inicia sesión para consultar tus documentos. <a href="/sprint-6-2/persistencia">Iniciar sesión</a></p>}
    {state==="error"&&<p role="alert">No fue posible consultar el historial. No se han alterado tus mediciones.</p>}
    {state==="ready"&&<>
     <h2 style={{fontSize:17,marginBottom:10}}>{rows.length} registros de origen</h2>
     {rows.length===0?<p>Aún no hay importaciones guardadas.</p>:
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",minWidth:760,borderCollapse:"collapse",fontSize:12}}>
       <thead><tr style={{background:"#f1edff",textAlign:"left"}}>{["Fecha de muestra","Archivo","Laboratorio","Mediciones vinculadas","Revisión","Registro"].map(h=><th key={h} style={{padding:12}}>{h}</th>)}</tr></thead>
       <tbody>{rows.map((r,i)=><tr key={r.sha||r.date+"-"+i} style={{borderBottom:"1px solid #ece7f7"}}>
        <td style={{padding:12,whiteSpace:"nowrap",fontWeight:700}}>{formatDate(r.date)}</td>
        <td style={{padding:12}}>{r.filename}</td>
        <td style={{padding:12}}>{r.lab}</td>
        <td style={{padding:12}}>{r.measurementCount}</td>
        <td style={{padding:12}}>{r.reviewed===null?"Sin registro de revisión":r.confirmed+" confirmados · "+r.pending+" pendientes · "+r.excluded+" excluidos"}</td>
        <td style={{padding:12}}>{r.source==="legacy"?"Histórico previo":r.created_at?new Date(r.created_at).toLocaleDateString("es-ES"):"Registrado"}</td>
       </tr>)}</tbody>
      </table>
     </div>}
    </>}
   </section>
   <p style={{fontSize:11,color:"#777085",marginTop:13}}>Las cargas anteriores a este Sprint pueden no tener nombre del archivo ni laboratorio registrado. No se inventan datos faltantes.</p>
 </main>;
}
