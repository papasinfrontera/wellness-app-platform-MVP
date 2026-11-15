"use client";
import {useEffect,useMemo,useState} from "react";
import {useWellnessAuth} from "../../components/WellnessAuthProvider";
import {applyLabCorrections,type LabCorrection} from "@/lib/lab-corrections";
import "../analisis.css";

type Reading={id:string;value:number;unit:string;observed_at:string;raw_label:string|null;source_key:string|null;
 indicators:{code:string;name_es:string}|{code:string;name_es:string}[]|null};
const numberValue=(value:number)=>new Intl.NumberFormat("es-ES",{maximumFractionDigits:6}).format(value);
function day(value:string){return value.slice(0,10).split("-").reverse().join("/");}
export default function CorreccionesLaboratorio(){
 const {client,user,status}=useWellnessAuth();
 const [readings,setReadings]=useState<Reading[]>([]);
 const [events,setEvents]=useState<LabCorrection[]>([]);
 const [loadState,setLoadState]=useState<"loading"|"ready"|"error">("loading");
 const [selected,setSelected]=useState("");
 const [newValue,setNewValue]=useState("");
 const [newUnit,setNewUnit]=useState("");
 const [reason,setReason]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  if(status!=="signed_in"||!client||!user){setReadings([]);setEvents([]);setLoadState(status==="loading"?"loading":"ready");return;}
  let active=true;setLoadState("loading");
  void Promise.all([
   client.from("observations")
    .select("id,value,unit,observed_at,raw_label,source_key,indicators(code,name_es)")
    .eq("user_id",user.id).eq("origin","laboratory").eq("status","approved")
    .order("observed_at",{ascending:false}).limit(2000),
   client.from("lab_observation_corrections")
    .select("id,observation_id,corrected_value,corrected_unit,reason,created_at")
    .eq("user_id",user.id).order("created_at",{ascending:false}).limit(2000)
  ]).then(([records,changes])=>{
    if(!active)return;
    if(records.error||changes.error){setLoadState("error");return;}
    setReadings((records.data||[]) as unknown as Reading[]);
    setEvents((changes.data||[]) as LabCorrection[]);
    setLoadState("ready");
  }).catch(()=>{if(active)setLoadState("error")});
  return()=>{active=false};
 },[client,user,status,reload]);
 const effective=useMemo(()=>applyLabCorrections(readings,events),[readings,events]);
 const chosen=effective.find(x=>x.id===selected);
 const label=(r:Reading)=>{const item=Array.isArray(r.indicators)?r.indicators[0]:r.indicators;return item?.name_es||r.raw_label||"Indicador";};
 function choose(id:string){
  setSelected(id);setReason("");setMessage("");
  const r=effective.find(row=>row.id===id);
  setNewValue(r?String(r.value):"");setNewUnit(r?.unit||"");
 }
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!client||!user||!chosen||busy)return;
  const numeric=Number(newValue.trim().replace(",","."));
  if(!Number.isFinite(numeric)||Math.abs(numeric)>100000000000||!newUnit.trim()||newUnit.trim().length>40||reason.trim().length<10||reason.trim().length>500){
   setMessage("Verifica el valor numérico, la unidad y una justificación de 10 a 500 caracteres.");return;
  }
  if(numeric===chosen.value&&newUnit.trim()===chosen.unit){
   setMessage("La corrección debe cambiar el valor o la unidad.");return;
  }
  setBusy(true);setMessage("");
  const {error}=await client.from("lab_observation_corrections").insert({
   user_id:user.id,observation_id:chosen.id,corrected_value:numeric,
   corrected_unit:newUnit.trim(),reason:reason.trim()
  });
  setBusy(false);
  if(error){setMessage("No se pudo registrar la corrección. El resultado original permanece intacto.");return;}
  setSelected("");setReason("");setNewValue("");setNewUnit("");
  setMessage("Corrección registrada con fecha y usuario. La medición original se conserva.");setReload(x=>x+1);
 }
 const history=events.filter(e=>e.observation_id===selected);
 return <main className="wa-page" style={{maxWidth:1250,margin:"0 auto"}}>
  <a href="/mi-analisis" className="wa-back">‹ Volver a Mis análisis</a>
  <span className="wa-eyebrow">CONTROL Y TRAZABILIDAD · LABORATORIO</span>
  <h1 className="wa-title">Correcciones de resultados</h1>
  <p className="wa-subtitle">Las correcciones se registran como eventos nuevos. El valor del examen original nunca se modifica ni elimina.</p>
  {status!=="signed_in"?<section className="wa-explorer" style={{marginTop:20,padding:22}} role="status">{status==="loading"?"Verificando sesión…":<>Inicia sesión para consultar tus correcciones. <a href="/sprint-6-2/persistencia">Acceder</a></>}</section>:
  <section className="wa-explorer" style={{marginTop:20,padding:20}}>
   {loadState==="loading"?<p role="status">Cargando historial privado…</p>:loadState==="error"?<p role="alert">No fue posible consultar la información de tu cuenta.</p>:<>
    <h2 style={{fontSize:18}}>Selecciona una medición</h2>
    <div style={{maxHeight:400,overflow:"auto",border:"1px solid #EAE6F6",borderRadius:12}}>
     {effective.length===0?<p style={{padding:15}}>Aún no hay mediciones de laboratorio aprobadas.</p>:
      effective.map(row=><button type="button" key={row.id} aria-pressed={selected===row.id} onClick={()=>choose(row.id)}
       style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",gap:15,flexWrap:"wrap",textAlign:"left",padding:"13px 15px",background:selected===row.id?"#F2EDFF":"#fff",border:0,borderBottom:"1px solid #EEEAF5",cursor:"pointer",color:"#251C3B"}}>
        <span><strong style={{fontSize:12}}>{label(row)}</strong><span style={{display:"block",fontSize:11,color:"#766D8A",marginTop:4}}>{day(row.observed_at)}{row.corrected?" · Corregido":""}</span></span>
        <strong style={{fontSize:13}}>{numberValue(row.value)} {row.unit}</strong>
       </button>)}
    </div>
    {chosen&&<div style={{marginTop:20,padding:18,border:"1px solid #DDD6F5",borderRadius:13,background:"#FCFBFF"}}>
      <h3 style={{fontSize:17,margin:"0 0 10px"}}>Registrar una corrección · {label(chosen)}</h3>
      <p style={{fontSize:12,color:"#625A79"}}>Resultado original: <strong>{numberValue(chosen.originalValue)} {chosen.originalUnit}</strong> · {day(chosen.observed_at)}. Valor actual: <strong>{numberValue(chosen.value)} {chosen.unit}</strong>.</p>
      <form onSubmit={e=>{void submit(e)}} style={{display:"grid",gap:12}}>
       <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
        <label style={{display:"grid",gap:5,fontSize:12,fontWeight:700}}>Valor corregido
         <input aria-label="Nuevo valor de laboratorio" value={newValue} onChange={e=>setNewValue(e.target.value)} required style={{padding:11,borderRadius:9,border:"1px solid #D9D4E6"}}/>
        </label>
        <label style={{display:"grid",gap:5,fontSize:12,fontWeight:700}}>Unidad
         <input aria-label="Unidad corregida" value={newUnit} onChange={e=>setNewUnit(e.target.value)} maxLength={40} required style={{padding:11,borderRadius:9,border:"1px solid #D9D4E6"}}/>
        </label>
       </div>
       <label style={{display:"grid",gap:5,fontSize:12,fontWeight:700}}>Motivo de la corrección
        <textarea aria-label="Motivo obligatorio" value={reason} onChange={e=>setReason(e.target.value)} minLength={10} maxLength={500} required rows={3} placeholder="Explica qué verificaste en el informe original…" style={{padding:11,borderRadius:9,border:"1px solid #D9D4E6"}}/>
       </label>
       <p style={{fontSize:11,color:"#6F6981",margin:0}}>Esta acción crea una nueva versión con autor y fecha. No se borra ni se sobrescribe el registro original.</p>
       <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="submit" disabled={busy||reason.trim().length<10} style={{padding:"11px 15px",borderRadius:10,border:0,background:"#5B40F5",color:"#fff",fontWeight:800,cursor:"pointer"}}>{busy?"Registrando…":"Registrar corrección"}</button>
        <button type="button" onClick={()=>setSelected("")} style={{padding:"11px 15px",borderRadius:10,border:"1px solid #E3DDF0",background:"#fff"}}>Cancelar</button></div>
      </form>
      {history.length>0&&<div style={{marginTop:17,borderTop:"1px solid #EBE4F8",paddingTop:12}}>
       <strong style={{fontSize:12}}>Versiones anteriores ({history.length})</strong>
       {history.map(change=><p key={change.id} style={{fontSize:11,color:"#70687D",margin:"8px 0"}}>{new Date(change.created_at).toLocaleString("es-ES")}: {numberValue(Number(change.corrected_value))} {change.corrected_unit} · {change.reason}</p>)}
      </div>}
     </div>}
   </>}
  </section>}
  {message&&<p role="status" style={{marginTop:12,fontSize:12,color:"#6342A0"}}>{message}</p>}
 </main>;
}
