"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import catalog from "../catalog-reference.json";
import {classifyUnmatchedReading,type PdfRow,type PdfReview} from "@/lib/pdf-lab-review";
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

const valid=(r:Row)=>r.specimen!=="urine"&&!!r.indicatorCode&&!!r.value.trim()&&(!!r.unit.trim()||r.indicatorCode==="REF-028")&&numerical.test(r.value.trim());
function candidateList(query:string,code:string){
 const q=normalize(query.trim());
 const filtered=q?entries.filter(x=>[x.name,x.name_en,x.code,...(x.aliases||[])].some(y=>normalize(y).includes(q))):entries.filter(x=>x.code===code);
 return filtered.slice(0,12);
}
export default function PdfPilotPage(){
 const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [report,setReport]=useState<(PdfReview&{pages:number})|null>(null),[rows,setRows]=useState<Row[]>([]);
 const [search,setSearch]=useState<Record<string,string>>({}),[filter,setFilter]=useState("all"),[finished,setFinished]=useState(false),[bulkReviewed,setBulkReviewed]=useState(false);
 const [collectionDate,setCollectionDate]=useState("");
 const [laboratoryName,setLaboratoryName]=useState("");
 const [saveBusy,setSaveBusy]=useState(false),[saveNotice,setSaveNotice]=useState(""),[saved,setSaved]=useState(false);
 const [identity,setIdentity]=useState<"loading"|"signed_in"|"signed_out">("loading");
 const [recognized,setRecognized]=useState<string[]>([]);
 const [reconcileMessage,setReconcileMessage]=useState("");
 const [recognizedDate,setRecognizedDate]=useState("");
 const [selectedIds,setSelectedIds]=useState<string[]>([]);
 const [groupSelection,setGroupSelection]=useState<string[]>([]);
 const [groupAcknowledged,setGroupAcknowledged]=useState(false);
 const [rowAction,setRowAction]=useState<"confirmed"|"deferred"|"excluded">("confirmed");
 const [bulkPreview,setBulkPreview]=useState(false);
 const [bulkMessage,setBulkMessage]=useState("");
 const [duplicateCheck,setDuplicateCheck]=useState<"idle"|"loading"|"ready"|"error">("idle");
 const [duplicateMatches,setDuplicateMatches]=useState<string[]>([]);


 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{let mounted=true;const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   if(!u||!k){setIdentity("signed_out");return}
   const db=createClient(u,k);
   void db.auth.getUser().then(({data})=>{if(mounted)setIdentity(data.user?"signed_in":"signed_out")}).catch(()=>{if(mounted)setIdentity("signed_out")});
   return()=>{mounted=false};
 },[]);
 const asNumber=(input:string):number|null=>{
   const text=input.normalize("NFKC").trim().replace(/[\u00a0\u202f\u2009\u2007\s]/g,"").replace(/[−–]/g,"-");
   if(!/^[+-]?[0-9.,]+$/.test(text))return null;
   const decimalComma=text.includes(",")&&(text.lastIndexOf(",")>text.lastIndexOf(".")||!text.includes("."));
   const decimalDot=!decimalComma&&text.includes(".");
   const sep=decimalComma?",":decimalDot?".":"";
   const parts=sep?text.split(sep):[text];
   let normalized="";
   if(parts.length>1){
     const final=parts.at(-1)||"";
     const prefix=parts.slice(0,-1).join("");
     const thousandPattern=sep===","?/^[+-]?\d{1,3}(,\d{3})+$/:/^[+-]?\d{1,3}(\.\d{3})+$/;
     if(parts.length===2&&final.length===3&&thousandPattern.test(text)){
       normalized=text.replace(/[.,]/g,"");
     }else if(parts.length>2&&final.length===3&&thousandPattern.test(text)){
       normalized=text.replace(/[.,]/g,"");
     }else{
       normalized=prefix.replace(/[.,]/g,"")+"."+final;
     }
   }else normalized=text;
   const value=Number(normalized);
   return normalized!==""&&Number.isFinite(value)?value:null;
 };
 useEffect(()=>{
  if(!finished||!file||!collectionDate||identity!=="signed_in"){
    setDuplicateMatches([]);setDuplicateCheck("idle");return;
  }
  let live=true;
  setDuplicateCheck("loading");setDuplicateMatches([]);
  void(async()=>{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   if(!url||!key)throw new Error("NO_CONFIG");
   const db=createClient(url,key);
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||!user)throw new Error("AUTH_REQUIRED");
   const start=collectionDate+"T00:00:00.000Z";
   const next=new Date(Date.parse(start)+86400000).toISOString();
   const {data,error:readError}=await db.from("observations")
    .select("source_key,indicators(code)").eq("user_id",user.id)
    .eq("origin","laboratory").eq("status","approved")
    .gte("observed_at",start).lt("observed_at",next).limit(500);
   if(readError)throw readError;
   const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
   const sha=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
   const existing=new Set((data||[]).filter(item=>!item.source_key?.startsWith(sha+":")).flatMap(item=>{
    const related=item.indicators as {code?:string}|{code?:string}[]|null;
    const indicator=Array.isArray(related)?related[0]:related;
    return indicator?.code?[indicator.code]:[];
   }));
   const duplicates=[...new Set(rows.filter(row=>row.decision==="confirmed"&&existing.has(row.indicatorCode)).map(row=>row.original))];
   if(live){setDuplicateMatches(duplicates);setDuplicateCheck("ready")}
  })().catch(()=>{if(live){setDuplicateCheck("error");setDuplicateMatches([])}});
  return()=>{live=false};
 },[finished,collectionDate,file,identity,rows]);
 async function saveReviewed(){
   if(!file||!done||saveBusy||saved||!collectionDate||identity!=="signed_in"||duplicateCheck!=="ready"||duplicateMatches.length>0)return;
   const confirmedRows=rows.filter(r=>r.decision==="confirmed");
   const invalid=confirmedRows.filter(r=>asNumber(r.value)===null).map(r=>r.original);
   if(invalid.length){setSaveNotice("No se pudo interpretar el valor de: "+invalid.join(", ")+". Vuelve a editar esos resultados antes de guardar.");return}
   setSaveBusy(true);setSaveNotice("");
   try{
     const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
     if(!u||!k)throw new Error("Servicio no configurado");
     const db=createClient(u,k);
     const {data:{user},error:authError}=await db.auth.getUser();
     if(authError||!user){setIdentity("signed_out");throw new Error("Inicia sesión de nuevo para guardar.");}
     const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
     const sha=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
     const payload=rows.map(r=>({decision:r.decision,code:r.indicatorCode,original:r.original,value:r.value,unit:r.unit,numeric_value:r.decision==="confirmed"?asNumber(r.value):null,kind:classifyUnmatchedReading(r.original,r.value)}));
     const {data,error}=await db.rpc("save_lab_review_v3",{p_rows:payload,p_observed_on:collectionDate,p_sha256:sha,p_filename:file.name,p_lab_name:laboratoryName.trim()||null});
     if(error)throw new Error(error.message?.includes("POTENTIAL_DUPLICATE_SAME_DAY")?"Se detectó otro informe con un indicador de la misma fecha. Regresa a la revisión y excluye ese resultado, o utiliza el historial de correcciones. No se guardó ningún resultado de este lote.":"No se pudo completar el guardado seguro. No se registró una importación parcial.");
     setSaved(true);
     const result=data as {confirmed_saved?:number;confirmed_existing?:number;pending_saved?:number;pending_existing?:number;excluded?:number}|null;
     setSaveNotice("Documento registrado. Guardado seguro: "+(result?.confirmed_saved??0)+" resultados nuevos, "+(result?.confirmed_existing??0)+" ya existentes; "+(result?.pending_saved??0)+" lecturas pendientes nuevas y "+(result?.pending_existing??0)+" pendientes existentes. "+(result?.excluded??0)+" excluidas por decisión explícita.");
   }catch(e){setSaveNotice(e instanceof Error?e.message:"No fue posible guardar los análisis.");}
   finally{setSaveBusy(false)}
 }
 const reset=()=>{setSelectedIds([]);setBulkPreview(false);setBulkMessage("");setGroupSelection([]);setGroupAcknowledged(false);setFile(null);setReport(null);setRows([]);setRecognized([]);setRecognizedDate("");setReconcileMessage("");setSaved(false);setSaveNotice("");setCollectionDate("");setLaboratoryName("");setError("");setSearch({});setFinished(false);setBulkReviewed(false);setFilter("all");if(input.current)input.current.value=""};
 async function analyze(){
  if(!file)return;
  if(file.size>5*1024*1024){setError("El tamaño máximo es 5 MB.");return}
  setBusy(true);setGroupSelection([]);setGroupAcknowledged(false);setSelectedIds([]);setBulkPreview(false);setBulkMessage("");setError("");setReport(null);setRows([]);setRecognized([]);setRecognizedDate("");setReconcileMessage("");setFinished(false);setBulkReviewed(false);
  try{
   const body=new FormData();body.append("file",file);
   const response=await fetch("/api/lab-pdf-preview",{method:"POST",body,cache:"no-store"});
   const json=await response.json();
   if(!response.ok)throw new Error(json.error||"No se pudo analizar el PDF");
   const parsed:Row[]=(json.rows||[]).map((x:PdfRow)=>({...x,decision:"pending"}));
   setReport(json);setRows(parsed);
   if(identity!=="signed_in"){setReconcileMessage("Se extrajeron los resultados. Para comprobar coincidencias con una importación previa, inicia sesión en esta vista.");return;}
   const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   if(!u||!k)return;
   // Only the exact previously uploaded PDF fingerprint can reuse a prior review.
   const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
   const sha=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
   const db=createClient(u,k),{data:{user},error:authError}=await db.auth.getUser();
   if(authError||!user){setIdentity("signed_out");setReconcileMessage("Inicia sesión para consultar las importaciones anteriores.");return;}
   const {data:stored,error:readError}=await db.from("observations")
    .select("value,unit,raw_label,source_key,observed_at,indicators(code)")
    .eq("user_id",user.id).eq("origin","laboratory").eq("status","approved")
    .like("source_key",sha+":%").limit(200);
   if(readError){setReconcileMessage("No se pudo comprobar el historial. Puedes revisar las 22 filas manualmente.");return;}
   type Existing={value:number;unit:string;raw_label:string|null;observed_at:string;indicators:{code:string}|{code:string}[]|null};
   const existing=(stored||[]) as Existing[];
   const normalizeUnit=(v:string)=>v.normalize("NFKC").replace(/\\s+/g,"").replace(/[μµ]/g,"u").toLowerCase();
   const matches=parsed.filter(row=>{
    const numeric=asNumber(row.value);
    if(!row.indicatorCode||numeric===null)return false;
    return existing.some(saved=>{
      const indicators=Array.isArray(saved.indicators)?saved.indicators[0]:saved.indicators;
      return indicators?.code===row.indicatorCode
        &&Number(saved.value)===numeric
        &&normalizeUnit(saved.unit)===normalizeUnit(row.unit)
        &&normalize(saved.raw_label||"")===normalize(row.original);
    });
   });
   if(matches.length===0){setReconcileMessage("No se encontró una revisión previa de este mismo archivo. Revisa las filas antes de importar.");return;}
   const dates=[...new Set(existing.filter(x=>matches.some(row=>{const marker=Array.isArray(x.indicators)?x.indicators[0]:x.indicators;return marker?.code===row.indicatorCode && Number(x.value)===asNumber(row.value) && normalizeUnit(x.unit)===normalizeUnit(row.unit) && normalize(x.raw_label||"")===normalize(row.original)})).map(x=>x.observed_at.slice(0,10)))];
   if(dates.length!==1){setReconcileMessage("Hay fechas distintas para este archivo. Se requiere revisión manual.");return;}
   setRecognized(matches.map(x=>x.id));
   setRecognizedDate(dates[0]);
   setReconcileMessage("Se reconocieron "+matches.length+" resultados idénticos de este PDF. Las "+(parsed.length-matches.length)+" filas restantes seguirán pendientes de comprobación; no se guardarán sin tu aprobación.");
  }catch(e){
   setReconcileMessage("No fue posible completar la comparación con el historial. Las filas extraídas siguen disponibles para revisión manual.");
  }finally{setBusy(false)}
 }
 function applyPriorReview(){
  if(!recognized.length||!recognizedDate||!report)return;
  const ids=new Set(recognized);
  setRows(previous=>previous.map(r=>({
   ...r,decision:ids.has(r.id)?"confirmed":r.decision==="pending"?"deferred":r.decision
  })));
  setCollectionDate(recognizedDate);
  setReconcileMessage("Confirmaciones recuperadas: "+recognized.length+". Se muestra ahora el filtro de lecturas pendientes ("+(rows.length-recognized.length)+"). Comprueba las filas antes de finalizar.");
  setRecognized([]);
  setFilter("deferred");
 }
 function edit(i:number,patch:Partial<Row>){setBulkPreview(false);setSelectedIds([]);setBulkReviewed(false);setRows(prev=>prev.map((r,j)=>j===i?{...r,...patch,decision:"pending"}:r))}
 function decide(i:number,decision:Decision){setBulkPreview(false);setSelectedIds([]);setRows(prev=>prev.map((r,j)=>j===i?{...r,decision}:r))}
 const confirmed=rows.filter(r=>r.decision==="confirmed").length,excluded=rows.filter(r=>r.decision==="excluded").length,deferred=rows.filter(r=>r.decision==="deferred").length;
 const pending=rows.length-confirmed-excluded-deferred,done=rows.length>0&&pending===0&&!report?.truncated;
 const visible=rows.map((row,index)=>({row,index})).filter(({row})=>filter==="all"||(filter==="pending"?row.decision==="pending":filter==="candidates"?row.decision==="pending"&&row.status==="candidate":row.decision===filter));
 function confirmCandidates(){if(!bulkReviewed)return;setBulkReviewed(false);setRows(prev=>prev.map(r=>r.decision==="pending"&&r.status==="candidate"&&valid(r)?{...r,decision:"confirmed"}:r))}
 function deferUnmapped(){setBulkReviewed(false);setRows(prev=>prev.map(r=>r.decision==="pending"&&!r.indicatorCode?{...r,decision:"deferred"}:r));}
 const unmappedToReview=rows.filter(r=>r.decision==="pending"&&!r.indicatorCode).length;
 const unresolvedRows=rows.filter(r=>!r.indicatorCode&&r.decision!=="excluded");
 const unresolvedByKind={
  qualitative:unresolvedRows.filter(r=>classifyUnmatchedReading(r.original,r.value)==="qualitative").length,
  complementary:unresolvedRows.filter(r=>classifyUnmatchedReading(r.original,r.value)==="complementary").length,
  unmapped:unresolvedRows.filter(r=>classifyUnmatchedReading(r.original,r.value)==="unmapped").length
 };


 const visibleIds=visible.map(({row})=>row.id);
 const selectedVisible=visibleIds.filter(id=>selectedIds.includes(id));
 const allVisibleSelected=visibleIds.length>0&&selectedVisible.length===visibleIds.length;
 const groupFor=(r:Row):"candidates"|"review"|"unmapped"|"excluded"|"confirmed"|"deferred"=>{
   if(r.decision==="excluded")return "excluded";
   if(r.decision==="confirmed")return "confirmed";
   if(r.decision==="deferred")return "deferred";
   if(!r.indicatorCode)return "unmapped";
   return r.status==="candidate"&&valid(r)?"candidates":"review";
 };
 const groupConfig=[
  {key:"candidates",label:"Candidatos válidos",count:rows.filter(r=>groupFor(r)==="candidates").length},
  {key:"review",label:"Requieren revisión",count:rows.filter(r=>groupFor(r)==="review").length},
  {key:"unmapped",label:"Sin equivalencia",count:rows.filter(r=>groupFor(r)==="unmapped").length},
  {key:"excluded",label:"Excluidos",count:rows.filter(r=>groupFor(r)==="excluded").length}
 ];
 const groupConfirmed=rows.filter(r=>groupSelection.includes("candidates")&&groupFor(r)==="candidates");
 const groupDeferred=rows.filter(r=>groupSelection.includes("unmapped")&&groupFor(r)==="unmapped");
 const groupNeedsReview=rows.filter(r=>groupSelection.includes("review")&&groupFor(r)==="review");
 const groupExcludedReview=rows.filter(r=>groupSelection.includes("excluded")&&groupFor(r)==="excluded");
 const eligibleSelected=rows.filter(r=>selectedIds.includes(r.id)&&r.decision==="pending"&&(rowAction!=="confirmed"||(valid(r)&&r.status==="candidate")));
 const ineligibleSelected=selectedIds.length-eligibleSelected.length;
 const isGroupMode=groupSelection.length>0;
 function selectVisible(){
  setBulkPreview(false);setBulkMessage("");setGroupSelection([]);setGroupAcknowledged(false);
  setSelectedIds(prev=>allVisibleSelected?prev.filter(id=>!visibleIds.includes(id)):[...new Set([...prev,...visibleIds])]);
 }
 function toggleGroup(key:string,enabled:boolean){
  setBulkPreview(false);setBulkMessage("");setSelectedIds([]);setGroupAcknowledged(false);
  setGroupSelection(prev=>enabled?[...prev,key]:prev.filter(id=>id!==key));
 }
 function prepareBulk(){
  if(!isGroupMode&&!selectedIds.length){setBulkMessage("Selecciona al menos una categoría o una fila.");return;}
  if(isGroupMode&&!groupAcknowledged){setBulkMessage("Marca que revisaste los grupos seleccionados antes de continuar.");return;}
  setBulkPreview(true);setBulkMessage("");
 }
 function applyBulk(){
  if(!bulkPreview)return;
  if(isGroupMode){
   const confirmations=new Set(groupConfirmed.map(r=>r.id));
   const deferrals=new Set(groupDeferred.map(r=>r.id));
   if(!confirmations.size&&!deferrals.size){setBulkMessage("Estos grupos requieren revisión individual; no se cambió ninguna decisión.");setBulkPreview(false);return;}
   setRows(prev=>prev.map(r=>confirmations.has(r.id)?{...r,decision:"confirmed"}:deferrals.has(r.id)?{...r,decision:"deferred"}:r));
   setBulkMessage("Se confirmaron "+confirmations.size+" candidatos válidos y se marcaron "+deferrals.size+" lecturas sin equivalencia como pendientes. Los demás grupos no se modificaron; aún no se guardó en Supabase.");
   setGroupSelection([]);setGroupAcknowledged(false);
  }else{
   if(!eligibleSelected.length)return;
   const approved=new Set(eligibleSelected.map(r=>r.id));
   setRows(prev=>prev.map(r=>approved.has(r.id)?{...r,decision:rowAction}:r));
   setBulkMessage("Se actualizaron "+approved.size+" decisiones seleccionadas. Nada se ha guardado en Supabase.");
  }
  setSelectedIds([]);setBulkPreview(false);setBulkReviewed(false);
 }
 const summary=()=>{
  if(!done)return;setFinished(true);window.scrollTo({top:0,behavior:"smooth"});
 };
 return <main className="wa-page">
 <a className="wa-back" href="/mi-analisis">‹ Volver a Mis análisis</a><div style={{marginTop:9}}><a href="/mi-analisis/pendientes" style={{fontSize:12,color:primary,fontWeight:750}}>Ver lecturas pendientes guardadas →</a> <span style={{margin:"0 8px",color:"#b6accd"}}>·</span><a href="/mi-analisis/archivos" style={{fontSize:12,color:primary,fontWeight:750}}>Historial de archivos →</a></div>
 <span className="wa-eyebrow">SPRINT 6.6-A.2 · REVISIÓN DE PDF</span>
 <h1 className="wa-title">Importa tus análisis</h1>
 <p className="wa-subtitle">Identifica, corrige y clasifica los resultados del PDF. La revisión es temporal; al guardar, las mediciones confirmadas entran en tu historial y las lecturas sin equivalencia quedan en una bandeja privada de pendientes.</p>
 <section className="wa-explorer" style={{marginTop:17,padding:18}}>
  <h2>1. Selecciona el PDF</h2><p className="wa-subtitle">Máximo 5 MB y 12 páginas · PDF digital con texto seleccionable · Sin OCR</p>
  <input ref={input} type="file" accept=".pdf,application/pdf" aria-label="Archivo PDF de laboratorio" style={{...fieldStyle,marginTop:12}} onChange={e=>{setFile(e.target.files?.[0]||null);setGroupSelection([]);setGroupAcknowledged(false);setSelectedIds([]);setBulkPreview(false);setBulkMessage("");setRows([]);setRecognized([]);setRecognizedDate("");setReconcileMessage("");setReport(null);setFinished(false);setError("")}}/>
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
   <p className="wa-subtitle">Se clasificaron {rows.length} filas: {confirmed} confirmadas, {deferred} pendientes para revisión futura y {excluded} excluidas. Todavía no se ha enviado la revisión a la base de datos.</p>
   <div style={{overflowX:"auto",marginTop:14}}><table style={{width:"100%",minWidth:620,borderCollapse:"collapse",fontSize:12}}>
    <thead><tr style={{background:"#f4f0ff"}}>{["N.º","Nombre original","Indicador revisado","Resultado","Decisión"].map(x=><th key={x} style={{textAlign:"left",padding:10}}>{x}</th>)}</tr></thead>
    <tbody>{rows.map((r,i)=><tr key={r.id} style={{borderBottom:"1px solid #eeeaf7"}}><td style={{padding:9}}>{i+1}</td><td style={{padding:9}}>{r.original}</td><td style={{padding:9}}>{r.indicatorName||"Sin asignar"}</td><td style={{padding:9}}>{r.value} {r.unit}</td><td style={{padding:9,fontWeight:700}}>{r.decision==="confirmed"?"Confirmado":r.decision==="excluded"?"Excluido":"Pendiente"}</td></tr>)}</tbody>
   </table></div>
   <div style={{marginTop:17,padding:15,border:"1px solid #e4def7",borderRadius:12,background:"#faf9ff"}}>
    <h3 style={{margin:"0 0 9px",fontSize:15}}>3. Guardar resultados en mi historial</h3>
    <p style={{fontSize:12,color:"#645d7d",margin:"0 0 12px"}}>Se conservarán {confirmed} mediciones confirmadas y {deferred} lecturas pendientes en tu cuenta. Las {excluded} excluidas no se guardarán. Para conservar las tres lecturas que faltaban, márcalas como «Pendiente» antes de finalizar. El PDF original no se almacena en esta fase.</p>
    <div style={{fontSize:11,color:"#716788",marginBottom:9}}>Documento: <strong>{file?.name||"No seleccionado"}</strong>. Se guarda el nombre y la huella digital; no el PDF original.</div>
    <label style={{display:"grid",gap:5,fontSize:12,fontWeight:700,marginBottom:10,maxWidth:360}}>Laboratorio (opcional)
      <input aria-label="Nombre del laboratorio" value={laboratoryName} onChange={e=>setLaboratoryName(e.target.value)} disabled={saved} maxLength={120} placeholder="Laboratorio indicado en el informe" style={fieldStyle}/>
    </label>
    <label style={{display:"grid",gap:5,fontSize:12,fontWeight:700}}>Fecha de toma de muestra
      <input type="date" aria-label="Fecha de toma de muestra" max={new Date().toISOString().slice(0,10)} value={collectionDate} onChange={e=>setCollectionDate(e.target.value)} disabled={saved} style={{...fieldStyle,maxWidth:280}}/>
    </label>
    {collectionDate&&identity==="signed_in"&&<>
     {duplicateCheck==="loading"&&<p role="status" style={{fontSize:12,color:"#665777"}}>Comprobando posibles duplicados de esa fecha…</p>}
     {duplicateCheck==="error"&&<p role="alert" style={{fontSize:12,color:"#923C41"}}>No se pudo comprobar el historial. Por seguridad, no se habilitará el guardado hasta verificar los duplicados.</p>}
     {duplicateCheck==="ready"&&duplicateMatches.length>0&&<div role="alert" style={{padding:12,marginTop:12,background:"#FFF7E9",border:"1px solid #EAD5A3",borderRadius:10,fontSize:12,color:"#684825"}}>
       <strong>Posibles duplicados ({duplicateMatches.length})</strong>
       <p>Ya hay resultados del mismo indicador y fecha provenientes de otro registro: {duplicateMatches.join(", ")}.</p>
       <p>Regresa a la revisión y excluye las filas repetidas. Si se trata de una rectificación, utiliza <a href="/mi-analisis/correcciones" style={{color:"#5B40F5",fontWeight:800}}>Historial de correcciones</a>. No se sobrescribirán resultados automáticamente.</p>
      </div>}
     {duplicateCheck==="ready"&&duplicateMatches.length===0&&<p role="status" style={{fontSize:11,color:"#407349"}}>Sin coincidencias de indicadores de otros informes en la fecha seleccionada. El mismo archivo se puede reimportar sin duplicar sus registros.</p>}
    </>}
    {identity==="signed_out"&&<p style={{fontSize:12,color:"#97521d"}}>Para guardar necesitas <a href="/sprint-6-2/persistencia">iniciar sesión</a> con tu cuenta.</p>}
    {identity==="loading"&&<p style={{fontSize:12}}>Verificando sesión…</p>}
    {saveNotice&&<p role="status" style={{fontSize:12,color:saved?"#286c39":"#9b303b"}}>{saveNotice}</p>}
    <div style={{display:"flex",gap:9,flexWrap:"wrap",marginTop:12}}>
      <button type="button" onClick={()=>void saveReviewed()} disabled={identity!=="signed_in"||!collectionDate||duplicateCheck!=="ready"||duplicateMatches.length>0||saveBusy||saved||(confirmed+deferred===0)} style={{...buttonStyle,background:primary,color:"white",opacity:identity==="signed_in"&&collectionDate&&duplicateCheck==="ready"&&duplicateMatches.length===0&&!saveBusy&&!saved&&(confirmed+deferred)?1:.45}}>{saveBusy?"Guardando…":saved?"Guardado correctamente":"Guardar "+confirmed+" resultados y "+deferred+" pendientes"}</button>
      {saved&&deferred>0&&<a href="/mi-analisis/pendientes" style={{...buttonStyle,background:"#fff0df",color:"#8d5819",textDecoration:"none"}}>Ver lecturas pendientes →</a>}
      {saved&&<a href="/mi-analisis" style={{...buttonStyle,background:"#ede9fe",color:primary,textDecoration:"none"}}>Abrir Mis análisis →</a>}
    </div>
  </div>
   <div style={{display:"flex",gap:8,marginTop:15}}><button type="button" onClick={()=>setFinished(false)} style={{...buttonStyle,background:primary,color:"white"}}>Volver a editar</button><button type="button" onClick={reset} style={{...buttonStyle,background:"#f0edfb",color:primary}}>Cerrar y limpiar sesión</button></div>
   <p className="wa-subtitle" style={{marginTop:12}}>Antes de guardar, la revisión es temporal. Una vez confirmada la importación, los resultados aprobados permanecen en tu historial.</p>
  </div>:<>
   <h2>2. Revisa los resultados</h2>
   <p className="wa-subtitle">{report.pages} página(s) · {report.linesExamined} líneas examinadas · {rows.length} resultados extraídos. Las propuestas son textuales, no validaciones clínicas.</p>
   <p style={{fontSize:12,color:"#5c5270",padding:"9px 12px",border:"1px solid #e6e1f4",borderRadius:10,marginTop:10}}>
    Por muestra: sangre y serología <strong>{rows.filter(r=>r.specimen==="blood").length}</strong> · orina <strong>{rows.filter(r=>r.specimen==="urine").length}</strong> · sin sección identificada <strong>{rows.filter(r=>!r.specimen||r.specimen==="unknown").length}</strong>.
    {rows.some(r=>r.specimen==="urine")&&<span style={{display:"block",marginTop:5,color:"#925320"}}>Los resultados de orina se conservarán para revisión; no se pueden confirmar mediante indicadores sanguíneos.</span>}
   </p>
   {report.warning&&<p style={{fontSize:12,color:"#594880",background:"#f5f0ff",padding:10,borderRadius:10,marginTop:11}}>{report.warning}</p>}
   {reconcileMessage&&<div role="status" style={{marginTop:10,padding:12,border:"1px solid #e0d9f3",background:"#f8f5ff",borderRadius:10,fontSize:12,color:"#463578"}}>
    {reconcileMessage}
    {recognized.length>0&&<div style={{marginTop:9}}><button type="button" onClick={applyPriorReview} style={{...buttonStyle,background:primary,color:"#fff"}}>Recuperar {recognized.length} confirmaciones del historial</button></div>}
   </div>}
   {report.truncated&&<p role="alert" style={{color:"#8e3e22",fontSize:12}}>Extracción incompleta: máximo 80 filas. No se puede finalizar.</p>}
   <div style={{position:"sticky",top:8,zIndex:5,background:"#fff",border:"1px solid #e6e1f4",borderRadius:12,padding:12,marginTop:12,boxShadow:"0 3px 12px #21134a0d"}}>
    <div style={{display:"flex",gap:9,flexWrap:"wrap",justifyContent:"space-between",alignItems:"center"}}>
     <strong style={{fontSize:12}}>Confirmados {confirmed} · Por revisar {pending} · Pendientes declarados {deferred} · Excluidos {excluded}</strong>
     <span style={{fontSize:11,color:"#645d7d"}}>{confirmed+deferred+excluded} de {rows.length} clasificados</span>
    </div>
    <div style={{background:"#eeeaf7",height:7,borderRadius:8,marginTop:9,overflow:"hidden"}}><div style={{height:"100%",width:(rows.length?100*(confirmed+deferred+excluded)/rows.length:0)+"%",background:primary}}/></div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12,alignItems:"center"}}>
     <button type="button" onClick={summary} disabled={!done} style={{...buttonStyle,background:primary,color:"white",opacity:done?1:.4}}>Finalizar revisión</button>
     <label style={{fontSize:11,fontWeight:700,marginLeft:"auto"}}>Mostrar <select aria-label="Filtrar resultados" value={filter} onChange={e=>setFilter(e.target.value)} style={{...fieldStyle,width:"auto",marginLeft:5}}><option value="all">Todos</option><option value="pending">Por revisar</option><option value="candidates">Candidatos</option><option value="confirmed">Confirmados</option><option value="deferred">Pendientes declarados</option><option value="excluded">Excluidos</option></select></label>
    </div>
    {unresolvedRows.length>0&&<div role="note" style={{marginTop:12,padding:"10px 13px",borderRadius:10,border:"1px solid #e9dcbf",background:"#fffcf5",fontSize:11,color:"#675538",lineHeight:1.6}}>
      <strong>Lecturas sin equivalencia ({unresolvedRows.length}):</strong> {unresolvedByKind.unmapped} sin indicador, {unresolvedByKind.qualitative} cualitativas y {unresolvedByKind.complementary} complementarias. Usa «Sin equivalencia» para conservarlas como pendientes y revisarlas después; no las fuerces a un indicador diferente. Solo las confirmaciones válidas entrarán en el historial de mediciones.
    </div>}
    <div className="wa-bulk-pdf-bar" style={{marginTop:12,padding:12,background:"#f8f6ff",borderRadius:11}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <strong style={{fontSize:12,color:"#282043"}}>Aprobación por grupos</strong>
        <div role="group" aria-label="Categorías para aprobación masiva" style={{display:"flex",justifyContent:"flex-end",flexWrap:"wrap",alignItems:"center",gap:8,marginLeft:"auto"}}>
         {groupConfig.map(g=><label key={g.key} style={{display:"inline-flex",alignItems:"center",gap:6,border:"1px solid #e5dff5",borderRadius:9,background:groupSelection.includes(g.key)?"#eee9ff":"#fff",padding:"8px 10px",fontSize:11,fontWeight:700,color:"#44346e",cursor:g.count?"pointer":"default",whiteSpace:"nowrap"}}>
          <input type="checkbox" disabled={g.count===0} checked={groupSelection.includes(g.key)} onChange={e=>toggleGroup(g.key,e.target.checked)} aria-label={g.label+" ("+g.count+")"}/>
          {g.label} <span style={{borderRadius:12,background:"#f3efff",padding:"2px 6px",fontVariantNumeric:"tabular-nums"}}>{g.count}</span>
         </label>)}
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:9,flexWrap:"wrap",marginTop:10}}>
       <label style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:11,color:"#625879"}}>
        <input type="checkbox" checked={groupAcknowledged} disabled={!isGroupMode} onChange={e=>{setGroupAcknowledged(e.target.checked);setBulkPreview(false)}}/> Revisé los grupos seleccionados
       </label>
       <button type="button" disabled={!isGroupMode||!groupAcknowledged} onClick={prepareBulk} style={{...buttonStyle,background:primary,color:"white",opacity:isGroupMode&&groupAcknowledged?1:.45}}>Revisar acciones seleccionadas</button>
       <button type="button" disabled={!isGroupMode} onClick={()=>{setGroupSelection([]);setGroupAcknowledged(false);setBulkPreview(false);setBulkMessage("");}} style={{...buttonStyle,background:"#eeeaf7",color:"#5b40a0"}}>Limpiar grupos</button>
      </div>
      <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid #e9e3f4",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
       <label style={{fontSize:11,display:"inline-flex",alignItems:"center",gap:6,fontWeight:700}}>
        <input type="checkbox" aria-label="Seleccionar todas las filas visibles" checked={allVisibleSelected} onChange={selectVisible} disabled={visibleIds.length===0}/> Seleccionar visibles ({visible.length})
       </label>
       <span style={{fontSize:11,color:"#60597b"}}>{selectedIds.length} filas seleccionadas</span>
       <label style={{fontSize:11,fontWeight:700}}>Acción individual por selección
        <select aria-label="Acción para filas seleccionadas" value={rowAction} onChange={e=>{setRowAction(e.target.value as "confirmed"|"deferred"|"excluded");setBulkPreview(false)}} style={{...fieldStyle,width:"auto",marginLeft:6}}>
         <option value="confirmed">Confirmar válidos</option><option value="deferred">Marcar pendientes</option><option value="excluded">Excluir seleccionados</option>
        </select>
       </label>
       <button type="button" disabled={!selectedIds.length} onClick={prepareBulk} style={{...buttonStyle,background:"#eeeaff",color:primary,opacity:selectedIds.length?1:.45}}>Revisar filas</button>
       <button type="button" disabled={!selectedIds.length} onClick={()=>{setSelectedIds([]);setBulkPreview(false);setBulkMessage("");}} style={{...buttonStyle,background:"#eeeaf7",color:"#5b40a0"}}>Limpiar filas</button>
      </div>
    </div>
    {bulkPreview&&<div role="status" style={{marginTop:8,border:"1px solid #e5dcf9",borderRadius:11,padding:12,background:"#fffdf8",fontSize:12}}>
      <strong>Resumen antes de aplicar decisiones</strong>
      {isGroupMode?<p style={{margin:"7px 0"}}>{groupConfirmed.length} candidatos válidos se confirmarán; {groupDeferred.length} lecturas sin equivalencia se marcarán como pendientes. {groupNeedsReview.length} filas requieren revisión manual y {groupExcludedReview.length} excluidas se conservarán sin cambios. Ningún grupo se aprobará a ciegas.</p>:<p style={{margin:"7px 0"}}>{eligibleSelected.length} filas seleccionadas se cambiarán a {rowAction==="confirmed"?"Confirmado":rowAction==="deferred"?"Pendiente":"Excluido"}. {ineligibleSelected>0&&ineligibleSelected+" no cumplen los requisitos y seguirán sin cambios."}</p>}
      <p style={{margin:"6px 0"}}>La acción solo clasifica la revisión actual. Guardar en el historial es un paso posterior.</p>
      <button type="button" disabled={isGroupMode?groupConfirmed.length+groupDeferred.length===0:eligibleSelected.length===0} onClick={applyBulk} style={{...buttonStyle,background:primary,color:"#fff",opacity:(isGroupMode?groupConfirmed.length+groupDeferred.length:eligibleSelected.length)?1:.45}}>Aplicar decisiones</button>
      <button type="button" onClick={()=>setBulkPreview(false)} style={{...buttonStyle,marginLeft:7,background:"#efedf6",color:"#574e72"}}>Cancelar</button>
    </div>}
    {bulkMessage&&<p role="status" style={{fontSize:11,color:"#625078",margin:"8px 0"}}>{bulkMessage}</p>}
    {!done&&<p style={{fontSize:11,color:"#777085",margin:"9px 0 0"}}>Para finalizar, clasifica cada fila: confirmar, excluir o marcar como pendiente. Solo se confirmarán en bloque candidatos con valor y unidad válidos.</p>}
   </div>
   <div style={{marginTop:12,overflowX:"auto"}}>
    <table style={{borderCollapse:"separate",borderSpacing:"0 6px",width:"100%",minWidth:740,fontSize:11}}>
     <thead><tr>{["Seleccionar","Análisis original","Indicador sugerido · buscar y elegir","Resultado","Estado y acción"].map(x=><th key={x} style={{textAlign:"left",padding:"5px 8px",color:"#6e6687"}}>{x}</th>)}</tr></thead>
     <tbody>{visible.map(({row,index:i})=><tr key={row.id} style={{verticalAlign:"top",background:row.decision==="confirmed"?"#f8fdf9":"#faf9ff"}}>
      <td style={{padding:"14px 8px",width:35}}><input type="checkbox" aria-label={"Seleccionar fila "+(i+1)+" "+row.original} checked={selectedIds.includes(row.id)} onChange={e=>{setGroupSelection([]);setGroupAcknowledged(false);setBulkPreview(false);setBulkMessage("");setSelectedIds(prev=>e.target.checked?[...new Set([...prev,row.id])]:prev.filter(id=>id!==row.id));}}/></td>
      <td style={{padding:10,width:"23%",borderRadius:"10px 0 0 10px"}}><strong>{i+1}. {row.original}</strong>{row.section&&<div style={{fontSize:10,marginTop:4,color:row.specimen==="urine"?"#925320":"#6b57ac",fontWeight:700}}>{row.section} · {row.specimen==="urine"?"Muestra de orina":"Muestra de sangre / serología"}</div>}<div style={{fontSize:10,marginTop:5,color:"#757087",lineHeight:1.4}}>{row.reason}</div></td>
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
 <section className="wa-explorer" style={{marginTop:15,padding:17}}><h2>Seguridad del piloto</h2><p className="wa-subtitle">PDF procesado temporalmente en servidor. Los resultados, las decisiones y el resumen quedan solo en memoria de esta pantalla. Al guardar con sesión autenticada y fecha de muestra, las mediciones confirmadas se conservan en el historial y las lecturas pendientes en una bandeja privada. No se generan diagnósticos ni se activan importaciones automáticas.</p></section>
 </main>;
}
