"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {createClient} from "@supabase/supabase-js";
import catalogNames from "../catalog-reference.json";
import "../analisis.css";
import {applyLabCorrections,type LabCorrection} from "@/lib/lab-corrections";
type Metric={name:string;code?:string};
type Point={id:string;value:number;unit:string;observed_at:string;corrected?:boolean};
const names=catalogNames as {id:number;name:string;name_en?:string;aliases?:string[];code?:string}[];
const tabs=["Impacto en Healthspan","Qué es","Por qué es importante","Otros indicadores","Dispositivos conectados","Cómo mejorar","Fuentes científicas"];
const date=(s:string)=>new Intl.DateTimeFormat("es",{day:"numeric",month:"short",year:"numeric"}).format(new Date(s));
const val=(n:number)=>n.toLocaleString("es",{maximumFractionDigits:2});
function LineChart({points}:{points:Point[]}){
 const arranged=[...points].sort((a,b)=>new Date(a.observed_at).getTime()-new Date(b.observed_at).getTime());
 if(arranged.length<2)return <div className="wa-chart-placeholder">Se necesitan al menos dos mediciones para visualizar la evolución longitudinal.<br/>No se generan tendencias a partir de un único resultado.</div>;
 const values=arranged.map(p=>p.value),min=Math.min(...values),max=Math.max(...values),padding=Math.max((max-min)*.2,Math.abs(max)*.06,0.5),lo=min-padding,hi=max+padding;
 const coords=arranged.map((p,i)=>({x:45+i*555/(arranged.length-1),y:250-205*(p.value-lo)/(hi-lo),point:p}));
 return <div><svg viewBox="0 0 660 295" role="img" aria-label="Gráfica de evolución de valores registrados" style={{width:"100%",maxHeight:310}}>
  {[55,120,185,250].map(y=><line key={y} x1="45" y1={y} x2="615" y2={y} stroke="#ede9f5" strokeDasharray="3 4"/>)}
  <polyline points={coords.map(c=>c.x+","+c.y).join(" ")} fill="none" stroke="#6034e8" strokeWidth="3.5" strokeLinejoin="round"/>
  {coords.map((c,i)=><g key={i}><circle cx={c.x} cy={c.y} r="7" stroke="#6034e8" strokeWidth="3" fill="#fff"/><text x={c.x} y={Math.max(22,c.y-16)} fontSize="12" textAnchor="middle" fontWeight="bold" fill="#171737">{val(c.point.value)}</text><text x={c.x} y="284" fontSize="10" textAnchor="middle" fill="#77738b">{date(c.point.observed_at)}</text></g>)}
 </svg><p className="wa-future">Se muestran valores reales; no se utilizan rangos clínicos todavía.</p></div>;
}
export default function IndicatorDetail(){
 const params=useParams(),id=Number(params.id),item=names.find(x=>x.id===id);
 const [active,setActive]=useState("Impacto en Healthspan"),[view,setView]=useState<"chart"|"history">("chart");
 const [mode,setMode]=useState<"loading"|"denied"|"ready"|"error">("loading"),[points,setPoints]=useState<Point[]>([]);
 useEffect(()=>{let alive=true;void(async()=>{
  if(!item){setMode("error");return}
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){setMode("error");return}
  const db=createClient(url,key),{data:{user},error}=await db.auth.getUser();
  if(!alive)return;
  if(error||!user){setMode("denied");return}
  const {data:possible,error:lookupError}=await db.from("indicators").select("id,code,name_es").eq("code","REF-"+String(item.id).padStart(3,"0")).limit(1);
  if(!alive)return;
  if(lookupError){setMode("error");return}
  if(!possible?.length){setPoints([]);setMode("ready");return}
  const [observations,corrections]=await Promise.all([
   db.from("observations").select("id,value,unit,observed_at").eq("user_id",user.id).eq("indicator_id",possible[0].id).order("observed_at",{ascending:true}).limit(500),
   db.from("lab_observation_corrections").select("id,observation_id,corrected_value,corrected_unit,reason,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(2000)
  ]);
  if(!alive)return;
  if(observations.error||corrections.error){setMode("error");return}
  const measured=(observations.data||[]).filter(p=>typeof p.value==="number") as Point[];
  setPoints(applyLabCorrections(measured,(corrections.data||[]) as LabCorrection[]));setMode("ready");
 })().catch(()=>{if(alive)setMode("error")});return()=>{alive=false}},[item?.id]);
 const last=points.at(-1),prior=points.length>=2?points.at(-2):undefined;
 const difference=last&&prior?last.value-prior.value:null;
 const percent=difference!==null&&prior&&prior.value!==0?difference/prior.value*100:null;
 const text=useMemo(()=>{
  if(active==="Qué es")return (item?.name_en||item?.name)?.match(/apolipoprotein b|apob/i)?"La apolipoproteína B es una proteína presente en las principales partículas que transportan colesterol y otros lípidos. Su medición contribuye a la valoración del riesgo cardiovascular.":"Este indicador forma parte del catálogo de análisis. Su descripción científica específica está pendiente de revisión.";
  if(active==="Fuentes científicas")return "Las referencias individuales y sus fechas de revisión se incorporarán tras la auditoría del Consejo Médico-Científico.";
  if(active==="Dispositivos conectados")return "Las posibles relaciones con datos de dispositivos se evaluarán cuando estén disponibles y exista autorización para utilizarlos.";
  if(active==="Cómo mejorar")return "Las recomendaciones personalizadas requieren información validada, contexto clínico y revisión del motor científico. No se generan indicaciones médicas automáticas.";
  if(active==="Impacto en Healthspan")return "Esta sección explicará la relación del indicador con el bienestar y la salud a largo plazo, tras la revisión científica. Una evolución favorable no implica por sí sola un beneficio clínico demostrado.";
  if(active==="Por qué es importante")return "El valor de este análisis depende de su contexto, del método de medición y de las referencias clínicas aplicables. La explicación individual está pendiente de validación.";
  return "Los indicadores relacionados estarán disponibles cuando se complete la clasificación científica.";
 },[active,item?.name]);
 return <main className="wa-page wa-detail-shell"><a className="wa-back" href="/mi-analisis">‹ Volver a mis análisis</a>
  {!item?<div className="wb-state">El indicador solicitado no está disponible en el catálogo de referencia.</div>:mode==="denied"?<div className="wb-state"><h2>Acceso privado</h2><p>Inicia sesión para consultar tu historial.</p><a className="wb-action" href="/sprint-6-2/persistencia">Iniciar sesión</a></div>:<>
  <span className="wa-eyebrow">FICHA INDIVIDUAL · HISTORIAL DE RESULTADOS</span><h1 className="wa-detail-title">{item.name}</h1>
  <p className="wa-subtitle">{(item.name_en||item.name).match(/apolipoprotein b|apob/i)?"La ApoB es una proteína presente en las principales partículas que transportan colesterol y otros lípidos. Su medición ayuda a evaluar el riesgo cardiovascular.":"Información del indicador y evolución personal cuando se disponga de resultados asociados."}</p>
  <div className="wa-tags"><span className="wa-tag">Análisis de laboratorio</span><span className="wa-tag">Historial personal</span><span className="wa-tag">Fuentes en validación</span></div>
  <section className="wa-detail-metrics">
   <article className="wa-detail-metric"><h3>Resultado seleccionado {last?"· "+date(last.observed_at):""}</h3><strong>{last?val(last.value):"—"}</strong> {last?.unit||""}<p className="wa-future">{last?"(last.corrected?"Valor corregido con historial de cambios. ":"")+"Interpretación pendiente de validación":"Sin datos disponibles"}</p></article>
   <article className="wa-detail-metric"><h3>Distancia al nivel óptimo de referencia</h3><strong>—</strong><p className="wa-future">Requiere referencia científica aprobada y método de medición compatible.</p></article>
   <article className="wa-detail-metric"><h3>Cambio longitudinal</h3><strong>{difference===null?"—":(difference>0?"+":"")+val(difference)}</strong> {last?.unit||""}<p className="wa-future">{percent===null?"Se necesitan dos mediciones comparables":(percent>0?"+":"")+val(percent)+" % · cambio descriptivo"}</p></article>
  </section>
  <section className="wa-range-card"><h2>Tu posición dentro del rango</h2><div className="wa-chart-placeholder" style={{marginTop:0,padding:22}}>No se muestra un rango hasta que esté científicamente verificado para este indicador, método y contexto.</div></section>
  <section className="wa-detail-grid"><article className="wa-detail-panel"><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><h2 style={{margin:0}}>Evolución de {item.name}</h2><div className="wa-mode-switch"><button className={view==="chart"?"on":""} onClick={()=>setView("chart")}>Gráfico</button><button className={view==="history"?"on":""} onClick={()=>setView("history")}>Historial</button></div></div>
   {view==="chart"?<LineChart points={points}/>:<div style={{marginTop:20}}>{points.length?points.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",gap:10,padding:12,borderBottom:"1px solid #eeeaf4",fontSize:12}}><span>{date(p.observed_at)}</span><b>{val(p.value)} {p.unit}</b></div>):<div className="wa-chart-placeholder">No existen mediciones en el historial de esta cuenta.</div>}</div>}
  </article>
  <article className="wa-detail-panel"><h2>Conoce tu indicador</h2><div className="wa-detail-tabs">{tabs.map((tab,i)=><button key={tab} className={active===tab?"on":""} onClick={()=>setActive(tab)}>{tab}</button>)}</div><p className="wa-explainer">{text}</p></article></section>
  <p style={{fontSize:12}}><a href="/mi-analisis/correcciones" style={{color:"#5B40F5",fontWeight:800}}>Consultar o registrar correcciones →</a></p>
  <p className="wa-disclaimer">Los valores personales provienen de la cuenta autenticada. Los límites de referencia, estados clínicos y explicaciones están sujetos a validación y no sustituyen asesoramiento profesional.</p>
  </>}
 </main>
}
