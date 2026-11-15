"use client";
import {useRef,useState} from "react";
import catalog from "../catalog-reference.json";
import type {PdfRow,PdfReview} from "@/lib/pdf-lab-review";
import "../analisis.css";
type Decision="pending"|"confirmed"|"excluded"|"deferred";
type Row=PdfRow&{decision:Decision};
type Entry={code:string;name:string;name_en:string;aliases?:string[]};
const entries=catalog as Entry[];
const primary="#5B40F5";
const fieldStyle={width:"100%",minWidth:0,border:"1px solid #e3def3",borderRadius:9,padding:"9px 10px",background:"#fff",color:"#24203f",fontSize:12};
const buttonStyle={border:0,borderRadius:9,padding:"9px 12px",fontSize:11,fontWeight:750 as const,cursor:"pointer"};
const normalize=(s:string)=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const numerical=/^[<>≤≥]?\s*[+-]?\d+(?:[.,]\d+)?$/;
const valid=(r:Row)=>!!r.indicatorCode&&!!r.value.trim()&&(!!r.unit.trim()||r.indicatorCode==="REF-028")&&numerical.test(r.value.trim());
function candidateList(query:string,code:string){
 const q=normalize(query.trim());
 const filtered=q?entries.filter(x=>[x.name,x.name_en,x.code,...(x.aliases||[])].some(y=>normalize(y).includes(q))):entries.filter(x=>x.code===code);
 return filtered.slice(0,12);
}
export default function PdfPilotPage(){
 const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [report,setReport]=useState<(PdfReview&{pages:number})|null>(null),[rows,setRows]=useState<Row[]>([]);
 const [search,setSearch]=useState<Record<string,string>>({}),[filter,setFilter]=useState("all"),[finished,setFinished]=useState(false),[bulkReviewed,setBulkReviewed]=useState(false);
 const input=useRef<HTMLInputElement>(null);
 const reset=()=>{setFile(null);setReport(null);setRows([]);setError("");setSearch({});setFinished(false);setBulkReviewed(false);setFilter("all");if(input.current)input.current.value=""};
 async function analyze(){
  if(!file)return;
  if(file.size>5*1024*1024){setError("El tamaño máximo es 5 MB.");return}
  setBusy(true);setError("");setReport(null);setRows([]);setFinished(false);setBulkReviewed(false);setBulkReviewed(false);
  try{const body=new FormData();body.append("file",file);const response=await fetch("/api/lab-pdf-preview",{method:"POST",body,cache:"no-store"});const json=await response.json();
   if(!response.ok)throw new Error(json.error||"No se pudo analizar el PDF");
   setReport(json);setRows((json.rows||[]).map((x:PdfRow)=>({...x,decision:"pending"})));
  }catch(e){setError(e instanceof Error?e.message:"Error al leer PDF");}finally{setBusy(false)}
 }
 function edit(i:number,patch:Partial<Row>){setBulkReviewed(false);setRows(prev=>prev.map((r,j)=>j===i?{...r,...patch,decision:"pending"}:r))}
 function decide(i:number,decision:Decision){setRows(prev=>prev.map((r,j)=>j===i?{...r,decision}:r))}
 const confirmed=rows.filter(r=>r.decision==="confirmed").length,excluded=rows.filter(r=>r.decision==="excluded").length,deferred=rows.filter(r=>r.decision==="deferred").length;
 const pending=rows.length-confirmed-excluded-deferred,done=rows.length>0&&pending===0&&!report?.truncated;
 const visible=rows.map((row,index)=>({row,index})).filter(({row})=>filter==="all"||(filter==="pending"?row.decision==="pending":filter==="candidates"?row.decision==="pending"&&row.status==="candidate":row.decision===filter));
 function confirmCandidates(){if(!bulkReviewed)return;setBulkReviewed(false);setRows(prev=>prev.map(r=>r.decision==="pending"&&r.status==="candidate"&&valid(r)?{...r,decision:"confirmed"}:r))}
 const summary=()=>{
  if(!done)return;setFinished(true);window.scrollTo({top:0,behavior:"smooth"});
 };
 return <main className="wa-page">
 <a className="wa-back" href="/mi-analisis">‹ Volver a Mis análisis</a>
 <span className="wa-eyebrow">SPRINT 6.6-A.2 · REVISIÓN DE PDF</span>
 <h1 className="wa-title">Importa tus análisis</h1>
 <p className="wa-subtitle">Identifica, corrige y clasifica los resultados del PDF. La confirmación es temporal y <strong>no guarda datos médicos en Supabase</strong>.</p>
 <section className="wa-explorer" style={{marginTop:17,padding:18}}>
  <h2>1. Selecciona el PDF</h2><p className="wa-subtitle">Máximo 5 MB y 12 páginas · PDF digital con texto seleccionable · Sin OCR</p>
  <input ref={input} type="file" accept=".pdf,application/pdf" aria-label="Archivo PDF de laboratorio" style={{...fieldStyle,marginTop:12}} onChange={e=>{setFile(e.target.files?.[0]||null);setRows([]);setReport(null);setFinished(false);setError("")}}/>
  <div style={{display:"flex",gap:9,flexWrap:"wrap",marginTop:12,alignItems:"center"}}>
   <button type="button" disabled={!file||busy} onClick={analyze} style={{...buttonStyle,background:primary,color:"#fff",opacity:!file||busy?.5:1}}>{busy?"Extrayendo…":"Extraer resultados del PDF"}</button>
   <button type="button" onClick={reset} style={{...buttonStyle,background:"#f0edfb",color:primary}}>Limpiar sesión</button>
   {file&&<span style={{fontSize:11,color:"#706c81"}}>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</span>}
  </div>{error&&<p role="alert" style={{color:"#a32932",fontSize:12}}>{error}</p>}
 </section>
 {report&&<section className="wa-explorer" style={{padding:18,marginTop:15}}>
  {finished?<div>
   <span className="wa-eyebrow">REVISIÓN FINALIZADA · SOLO EN ESTA SESIÓN</span>
   <h2 style={{fontSize:23,marginTop:7}}>Resumen de revisión</h2>
   <p className="wa-subtitle">Se clasificaron {rows.length} filas: {confirmed} confirmadas, {deferred} pendientes para revisión futura y {excluded} excluidas. Ninguna medición ha sido guardada.</p>
   <div style={{overflowX:"auto",marginTop:14}}><table style={{width:"100%",minWidth:620,borderCollapse:"collapse",fontSize:12}}>
    <thead><tr style={{background:"#f4f0ff"}}>{["N.º","Nombre original","Indicador revisado","Resultado","Decisión"].map(x=><th key={x} style={{textAlign:"left",padding:10}}>{x}</th>)}</tr></thead>
    <tbody>{rows.map((r,i)=><tr key={r.id} style={{borderBottom:"1px solid #eeeaf7"}}><td style={{padding:9}}>{i+1}</td><td style={{padding:9}}>{r.original}</td><td style={{padding:9}}>{r.indicatorName||"Sin asignar"}</td><td style={{padding:9}}>{r.value} {r.unit}</td><td style={{padding:9,fontWeight:700}}>{r.decision==="confirmed"?"Confirmado":r.decision==="excluded"?"Excluido":"Pendiente"}</td></tr>)}</tbody>
   </table></div>
   <div style={{display:"flex",gap:8,marginTop:15}}><button type="button" onClick={()=>setFinished(false)} style={{...buttonStyle,background:primary,color:"white"}}>Volver a editar</button><button type="button" onClick={reset} style={{...buttonStyle,background:"#f0edfb",color:primary}}>Cerrar y limpiar sesión</button></div>
   <p className="wa-subtitle" style={{marginTop:12}}>La revisión no se ha enviado ni almacenado en una base de datos; al salir o recargar se perderá.</p>
  </div>:<>
   <h2>2. Revisa los resultados</h2>
   <p className="wa-subtitle">{report.pages} página(s) · {report.linesExamined} líneas examinadas · {rows.length} resultados extraídos. Las propuestas son textuales, no validaciones clínicas.</p>
   {report.warning&&<p style={{fontSize:12,color:"#594880",background:"#f5f0ff",padding:10,borderRadius:10,marginTop:11}}>{report.warning}</p>}
   {report.truncated&&<p role="alert" style={{color:"#8e3e22",fontSize:12}}>Extracción incompleta: máximo 80 filas. No se puede finalizar.</p>}
   <div style={{position:"sticky",top:8,zIndex:5,background:"#fff",border:"1px solid #e6e1f4",borderRadius:12,padding:12,marginTop:12,boxShadow:"0 3px 12px #21134a0d"}}>
    <div style={{display:"flex",gap:9,flexWrap:"wrap",justifyContent:"space-between",alignItems:"center"}}>
     <strong style={{fontSize:12}}>Confirmados {confirmed} · Por revisar {pending} · Pendientes declarados {deferred} · Excluidos {excluded}</strong>
     <span style={{fontSize:11,color:"#645d7d"}}>{confirmed+deferred+excluded} de {rows.length} clasificados</span>
    </div>
    <div style={{background:"#eeeaf7",height:7,borderRadius:8,marginTop:9,overflow:"hidden"}}><div style={{height:"100%",width:(rows.length?100*(confirmed+deferred+excluded)/rows.length:0)+"%",background:primary}}/></div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12,alignItems:"center"}}>
     <label style={{fontSize:11,display:"flex",alignItems:"center",gap:5}}><input type="checkbox" checked={bulkReviewed} onChange={e=>setBulkReviewed(e.target.checked)}/> Revisé las coincidencias candidatas</label><button type="button" disabled={!bulkReviewed} onClick={confirmCandidates} style={{...buttonStyle,background:"#eeeaff",color:primary,opacity:bulkReviewed?1:.45}}>Confirmar candidatos revisados</button>
     <button type="button" onClick={summary} disabled={!done} style={{...buttonStyle,background:primary,color:"white",opacity:done?1:.4}}>Finalizar revisión</button>
     <label style={{fontSize:11,fontWeight:700,marginLeft:"auto"}}>Mostrar <select aria-label="Filtrar resultados" value={filter} onChange={e=>setFilter(e.target.value)} style={{...fieldStyle,width:"auto",marginLeft:5}}><option value="all">Todos</option><option value="pending">Por revisar</option><option value="candidates">Candidatos</option><option value="confirmed">Confirmados</option><option value="deferred">Pendientes declarados</option><option value="excluded">Excluidos</option></select></label>
    </div>
    {!done&&<p style={{fontSize:11,color:"#777085",margin:"9px 0 0"}}>Para finalizar, clasifica cada fila: confirmar, excluir o marcar como pendiente. Solo se confirmarán en bloque candidatos con valor y unidad válidos.</p>}
   </div>
   <div style={{marginTop:12,overflowX:"auto"}}>
    <table style={{borderCollapse:"separate",borderSpacing:"0 6px",width:"100%",minWidth:740,fontSize:11}}>
     <thead><tr>{["Análisis original","Indicador sugerido · buscar y elegir","Resultado","Estado y acción"].map(x=><th key={x} style={{textAlign:"left",padding:"5px 8px",color:"#6e6687"}}>{x}</th>)}</tr></thead>
     <tbody>{visible.map(({row,index:i})=><tr key={row.id} style={{verticalAlign:"top",background:row.decision==="confirmed"?"#f8fdf9":"#faf9ff"}}>
      <td style={{padding:10,width:"23%",borderRadius:"10px 0 0 10px"}}><strong>{i+1}. {row.original}</strong><div style={{fontSize:10,marginTop:5,color:"#757087",lineHeight:1.4}}>{row.reason}</div></td>
      <td style={{padding:9,width:"35%"}}>
       <input aria-label={"Buscar indicador fila "+(i+1)} placeholder="Buscar por nombre o código…" style={{...fieldStyle,marginBottom:5}} value={search[row.id]??""} onChange={e=>setSearch(prev=>({...prev,[row.id]:e.target.value}))}/>
       <select size={1} aria-label={"Indicador fila "+(i+1)} style={fieldStyle} value={row.indicatorCode} onChange={e=>{const entry=entries.find(x=>x.code===e.target.value);edit(i,{indicatorCode:e.target.value,indicatorName:entry?.name||"",status:"review",reason:"Selección manual; comprobar analito, método y unidad."});setSearch(prev=>({...prev,[row.id]:""}))}}>
        <option value="">Sin asignar — revisar</option>
        {candidateList(search[row.id]||"",row.indicatorCode).some(x=>x.code===row.indicatorCode)?null:row.indicatorCode&&<option value={row.indicatorCode}>{row.indicatorName} ({row.indicatorCode})</option>}
        {candidateList(search[row.id]||"",row.indicatorCode).map(x=><option key={x.code} value={x.code}>{x.name} ({x.code})</option>)}
       </select>
      </td>
      <td style={{padding:9,width:"20%"}}><input aria-label={"Valor fila "+(i+1)} value={row.value} onChange={e=>edit(i,{value:e.target.value})} style={fieldStyle}/><input aria-label={"Unidad fila "+(i+1)} value={row.unit} placeholder="Unidad" onChange={e=>edit(i,{unit:e.target.value})} style={{...fieldStyle,marginTop:5}}/></td>
      <td style={{padding:9,width:"22%",borderRadius:"0 10px 10px 0"}}>
       <div style={{fontSize:10,fontWeight:800,color:row.decision==="confirmed"?"#257239":row.decision==="deferred"?"#b16423":"#6a599c",marginBottom:6}}>{row.decision==="confirmed"?"Confirmado":row.decision==="deferred"?"Pendiente declarado":row.decision==="excluded"?"Excluido":row.status==="candidate"?"Candidato":"Requiere revisión"}</div>
       <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
        <button type="button" disabled={!valid(row)} onClick={()=>decide(i,"confirmed")} style={{...buttonStyle,padding:"7px 9px",background:primary,color:"white",opacity:valid(row)?1:.38}}>Confirmar</button>
        <button type="button" onClick={()=>decide(i,"deferred")} style={{...buttonStyle,padding:"7px 9px",background:"#fff0df",color:"#94551a"}}>Pendiente</button>
        <button type="button" onClick={()=>decide(i,"excluded")} style={{...buttonStyle,padding:"7px 9px",background:"#efedf4",color:"#574f70"}}>Excluir</button>
       </div>
      </td>
     </tr>)}</tbody>
    </table>
    {visible.length===0&&<p style={{fontSize:12,color:"#6b6680",padding:14}}>No hay resultados en este filtro.</p>}
   </div>
   <div style={{padding:13,border:"1px solid #e9e3f5",borderRadius:12,marginTop:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
    <span style={{fontSize:12,color:"#655d7b"}}>{done?"Todas las filas están clasificadas.":"Quedan "+pending+" filas por clasificar."}</span>
    <button type="button" disabled={!done} onClick={summary} style={{...buttonStyle,background:primary,color:"white",opacity:done?1:.4}}>Finalizar revisión →</button>
   </div>
  </>}
 </section>}
 <section className="wa-explorer" style={{marginTop:15,padding:17}}><h2>Seguridad del piloto</h2><p className="wa-subtitle">PDF procesado temporalmente en servidor. Los resultados, las decisiones y el resumen quedan solo en memoria de esta pantalla. No se almacenan en Supabase, no se generan diagnósticos ni se activan importaciones automáticas.</p></section>
 </main>;
}
