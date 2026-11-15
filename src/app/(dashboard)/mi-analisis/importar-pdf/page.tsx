"use client";
import {useRef,useState} from "react";
import catalog from "../catalog-reference.json";
import type {PdfRow,PdfReview} from "@/lib/pdf-lab-review";
import "../analisis.css";
type Row=PdfRow&{decision:"pending"|"confirmed"|"excluded"};
const entries=catalog as {code:string;name:string;name_en:string}[];
const inputStyle={width:"100%",border:"1px solid #ddd9ed",borderRadius:9,padding:"9px 10px",background:"#fff",color:"#22213d",fontSize:12};
export default function PdfPilotPage(){
 const [file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [report,setReport]=useState<(PdfReview&{pages:number})|null>(null);
 const [rows,setRows]=useState<Row[]>([]);
 const input=useRef<HTMLInputElement>(null);
 const reset=()=>{setFile(null);setReport(null);setRows([]);setError("");if(input.current)input.current.value=""};
 async function analyze(){
  if(!file)return;
  if(file.size>5*1024*1024){setError("El tamaño máximo es 5 MB.");return}
  setBusy(true);setError("");setReport(null);setRows([]);
  try{
   const body=new FormData();body.append("file",file);
   const response=await fetch("/api/lab-pdf-preview",{method:"POST",body,cache:"no-store"});
   const json=await response.json();
   if(!response.ok)throw new Error(json.error||"No se pudo analizar el PDF");
   setReport(json);
   setRows((json.rows||[]).map((x:PdfRow)=>({...x,decision:"pending"})));
  }catch(e){setError(e instanceof Error?e.message:"Error de lectura de PDF");}
  finally{setBusy(false)}
 }
 function update(i:number,patch:Partial<Row>){setRows(prev=>prev.map((row,j)=>i===j?{...row,...patch,decision:"pending"}:row))}
 const confirmed=rows.filter(x=>x.decision==="confirmed").length,excluded=rows.filter(x=>x.decision==="excluded").length;
 return <main className="wa-page">
  <a className="wa-back" href="/mi-analisis">‹ Volver a Mis análisis</a>
  <span className="wa-eyebrow">SPRINT 6.6-A · LECTURA DE PDF · PILOTO</span>
  <h1 className="wa-title">Importa tus análisis</h1>
  <p className="wa-subtitle">Carga un PDF digital para detectar posibles resultados. Podrás revisar, corregir, confirmar o excluir cada fila. <strong>Este piloto no guarda archivos ni mediciones en Supabase.</strong></p>
  <section className="wa-explorer" style={{marginTop:20,padding:20}}>
   <h2>1. Selecciona un informe PDF</h2>
   <p className="wa-subtitle">Máximo 5 MB y 12 páginas · Solo PDF con texto seleccionable · Sin OCR</p>
   <label style={{display:"block",marginTop:15,fontSize:12,fontWeight:700}} htmlFor="pdf-lab-file">Documento de laboratorio</label>
   <input ref={input} id="pdf-lab-file" type="file" accept=".pdf,application/pdf" style={{...inputStyle,marginTop:8}} onChange={e=>{setFile(e.target.files?.[0]||null);setReport(null);setRows([]);setError("")}}/>
   {file&&<p style={{fontSize:12,color:"#696281",marginTop:9}}>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</p>}
   <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:15}}>
    <button type="button" disabled={!file||busy} onClick={analyze} style={{background:"#5B40F5",color:"white",border:0,borderRadius:10,padding:"12px 20px",fontSize:13,fontWeight:800,cursor:file&&!busy?"pointer":"not-allowed",opacity:file&&!busy?1:.5}}>{busy?"Analizando documento…":"Extraer resultados del PDF"}</button>
    <button type="button" onClick={reset} style={{background:"#f2effc",color:"#5B40F5",border:0,borderRadius:10,padding:"12px 18px",fontSize:13,fontWeight:700}}>Limpiar sesión</button>
   </div>
   {error&&<p role="alert" style={{color:"#a22c31",fontWeight:700,fontSize:12,marginTop:12}}>{error}</p>}
  </section>
  {report&&<section className="wa-explorer" style={{marginTop:16,padding:20}}>
   <h2>2. Resultados propuestos para revisión</h2>
   <p className="wa-subtitle">{report.pages} páginas · {report.linesExamined} líneas examinadas · {rows.length} posibles resultados. Cada registro requiere revisión humana y no se considera clínicamente validado.</p>
   {report.warning&&<p style={{background:"#f5f1ff",padding:12,borderRadius:10,fontSize:12,color:"#503c85",marginTop:12}}>{report.warning}</p>}
   {report.truncated&&<p role="alert" style={{fontSize:12,color:"#934016"}}>La extracción alcanzó el límite de 80 filas; revisa el documento original.</p>}
   <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginTop:15}}>
    {[["Detectados",rows.length],["Confirmados localmente",confirmed],["Excluidos",excluded]].map(([label,val])=><div key={label} style={{border:"1px solid #e7e4f5",borderRadius:12,padding:11}}><div style={{fontSize:11,color:"#6d6788"}}>{label}</div><strong style={{fontSize:24}}>{val}</strong></div>)}
   </div>
   <div style={{display:"grid",gap:12,marginTop:16}}>
    {rows.map((row,i)=><article key={row.id} style={{border:"1px solid #e8e4f1",borderRadius:13,padding:14}}>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <strong style={{fontSize:12}}>Fila {i+1} · {row.original}</strong>
      <span style={{fontSize:11,borderRadius:18,padding:"5px 10px",fontWeight:700,background:row.decision==="confirmed"?"#e7f6e7":row.decision==="excluded"?"#eeeef2":row.status==="review"?"#fff0df":"#f1efff",color:row.decision==="confirmed"?"#286437":row.decision==="excluded"?"#575766":row.status==="review"?"#91521a":"#5544a8"}}>{row.decision==="confirmed"?"Confirmado en pantalla":row.decision==="excluded"?"Excluido":row.status==="review"?"Requiere revisión":"Candidato"}</span>
     </div>
     <p style={{fontSize:11,lineHeight:1.5,color:"#716d82",margin:"6px 0 13px"}}>{row.reason}</p>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
      <label style={{fontSize:11,fontWeight:700}}>Indicador propuesto
       <select aria-label={"Indicador fila "+(i+1)} style={{...inputStyle,marginTop:6}} value={row.indicatorCode} onChange={e=>{const entry=entries.find(x=>x.code===e.target.value);update(i,{indicatorCode:e.target.value,indicatorName:entry?.name||"",status:"review",reason:"Indicador seleccionado manualmente; revisar muestra, método y unidad."})}}>
        <option value="">Sin asignar — revisar</option>{entries.map(entry=><option key={entry.code} value={entry.code}>{entry.name} ({entry.code})</option>)}
       </select>
      </label>
      <label style={{fontSize:11,fontWeight:700}}>Valor extraído
       <input aria-label={"Valor fila "+(i+1)} style={{...inputStyle,marginTop:6}} value={row.value} onChange={e=>update(i,{value:e.target.value})}/>
      </label>
      <label style={{fontSize:11,fontWeight:700}}>Unidad extraída
       <input aria-label={"Unidad fila "+(i+1)} style={{...inputStyle,marginTop:6}} value={row.unit} onChange={e=>update(i,{unit:e.target.value})}/>
      </label>
     </div>
     <div style={{display:"flex",gap:8,marginTop:13,flexWrap:"wrap"}}>
      <button type="button" disabled={!row.indicatorCode||!row.unit||!/^[<>≤≥]?\s*[+-]?\d+(?:[.,]\d+)?$/.test(row.value)} onClick={()=>setRows(prev=>prev.map((x,j)=>j===i?{...x,decision:"confirmed"}:x))} style={{border:0,padding:"8px 12px",borderRadius:8,background:"#5B40F5",color:"white",fontSize:11,fontWeight:700,opacity:row.indicatorCode&&row.unit?1:.45}}>Confirmar solo en pantalla</button>
      <button type="button" onClick={()=>setRows(prev=>prev.map((x,j)=>j===i?{...x,decision:"excluded"}:x))} style={{border:0,padding:"8px 12px",borderRadius:8,background:"#f0eff7",color:"#514c6b",fontSize:11,fontWeight:700}}>Excluir</button>
     </div>
    </article>)}
   </div>
   <p style={{fontSize:12,fontWeight:700,marginTop:19,color:"#5B40F5"}}>Sin botón de guardado: las decisiones se mantienen únicamente en esta pantalla y se pierden al salir o actualizar.</p>
  </section>}
  <section className="wa-explorer" style={{marginTop:16,padding:20}}>
   <h2>Qué hace y qué no hace este piloto</h2>
   <p className="wa-subtitle">Extrae texto de PDF digitales en una operación temporal de servidor. Busca coincidencias literales con el catálogo, señala ambigüedades y permite una revisión editable. No reconoce PDF escaneados, no verifica referencias científicas ni diagnostica, y no envía datos a Supabase.</p>
   <p className="wa-subtitle">Al usar esta función, el documento se envía temporalmente al servidor para extraer su texto. Evita documentos sensibles de terceros en pruebas iniciales.</p>
  </section>
 </main>
}
