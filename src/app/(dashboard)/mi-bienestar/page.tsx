"use client";
import {useEffect,useState} from "react";
import {createClient,type SupabaseClient} from "@supabase/supabase-js";
type Data={firstName:string;profileUpdated:string|null;analysisCount:number;analysisLatest:string|null;deviceCount:number;deviceLatest:string|null;goals:string[];hasHabits:boolean};
type Mode="loading"|"signin"|"error"|"ready";
const base:Data={firstName:"",profileUpdated:null,analysisCount:0,analysisLatest:null,deviceCount:0,deviceLatest:null,goals:[],hasHabits:false};
function client():SupabaseClient|null{const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return u&&k?createClient(u,k):null}
const date=(value:string|null)=>value?new Intl.DateTimeFormat("es",{day:"numeric",month:"short",year:"numeric"}).format(new Date(value)):"Sin registros";
export default function MiBienestar(){
 const [db]=useState(client),[mode,setMode]=useState<Mode>("loading"),[info,setInfo]=useState<Data>(base);
 useEffect(()=>{
  if(!db){setMode("error");return}
  let alive=true;
  void (async()=>{
   const {data:{user},error}=await db.auth.getUser();
   if(!alive)return;
   if(error||!user){setMode("signin");return}
   const [profile,analysis,device,analysisLast,deviceLast]=await Promise.all([
     db.from("wellness_profiles").select("first_name,goals,updated_at").eq("user_id",user.id).maybeSingle(),
     db.from("observations").select("id",{count:"exact",head:true}).eq("user_id",user.id),
     db.from("whoop_records").select("id",{count:"exact",head:true}).eq("user_id",user.id),
     db.from("observations").select("observed_at").eq("user_id",user.id).order("observed_at",{ascending:false}).limit(1),
     db.from("whoop_records").select("started_at").eq("user_id",user.id).order("started_at",{ascending:false}).limit(1)
   ]);
   if(!alive)return;
   if([profile,analysis,device,analysisLast,deviceLast].some(x=>x.error)){setMode("error");return}
   const p=profile.data;
   const goals=Array.isArray(p?.goals)?p.goals.filter((v:unknown):v is string=>typeof v==="string"):[];
   setInfo({firstName:p?.first_name||"",profileUpdated:p?.updated_at||null,analysisCount:analysis.count||0,analysisLatest:analysisLast.data?.[0]?.observed_at||null,deviceCount:device.count||0,deviceLatest:deviceLast.data?.[0]?.started_at||null,goals,hasHabits:false});
   setMode("ready");
  })().catch(()=>{if(alive)setMode("error")});
  return()=>{alive=false};
 },[db]);
 const needs=[...(info.analysisCount===0?[{text:"Incorpora tus análisis de laboratorio cuando el importador esté disponible.",href:"/mi-analisis",label:"Mis análisis"}]:[]),...(info.deviceCount===0?[{text:"La importación de dispositivos estará disponible en un próximo sprint.",href:"/dispositivos",label:"Dispositivos"}]:[]),...(info.goals.length===0?[{text:"Define tus objetivos personales en el perfil de bienestar.",href:"/mi-perfil",label:"Completar perfil"}]:[])].slice(0,3);
 return <main>
  <div className="wb-overview-top"><div><span className="wb-eyebrow">MI ESPACIO PERSONAL</span><h1 className="wb-page-title">{mode==="ready"&&info.firstName?info.firstName+", tu bienestar en perspectiva.":"Tu bienestar en perspectiva."}</h1><p className="wb-lead">Conoce tu evolución y descubre qué merece tu atención.</p></div><span className="wb-updated">Información personal · {new Intl.DateTimeFormat("es",{day:"numeric",month:"long",year:"numeric"}).format(new Date())}</span></div>
  {mode==="loading"&&<div className="wb-state" role="status">Preparando tu espacio de bienestar…</div>}
  {mode==="signin"&&<div className="wb-state"><h2>Tu bienestar, en un espacio privado</h2><p className="wb-lead">Accede a tu cuenta para visualizar información personal y comenzar tu seguimiento.</p><a href="/sprint-6-2/persistencia" className="wb-action">Iniciar sesión →</a></div>}
  {mode==="error"&&<div className="wb-state"><h2>No se pudo mostrar tu información</h2><p className="wb-lead">La información personal permanece protegida. Actualiza esta página para volver a intentarlo.</p></div>}
  {mode==="ready"&&<>
   <section className="wb-summary-grid" aria-label="Tres áreas de bienestar">
    <article className="wb-card wb-summary-card"><div className="wb-card-top"><span className="wb-card-label">Mis análisis</span><span className="wb-icon" aria-hidden="true">◇</span></div>
      <div><div className="wb-card-value">{info.analysisCount?info.analysisCount+" registros":"Aún sin resultados"}</div><p className="wb-card-detail">{info.analysisCount?"Observaciones personales disponibles. La interpretación de indicadores se incorporará al módulo de análisis.":"Tus resultados de laboratorio aparecerán aquí cuando estén incorporados al historial."}</p></div>
      <div className="wb-card-foot"><span className="wb-small-date">{info.analysisLatest?"Último: "+date(info.analysisLatest):"Sin fecha de análisis"}</span><a className="wb-card-link" href="/mi-analisis">Explorar ↗</a></div>
    </article>
    <article className="wb-card wb-summary-card"><div className="wb-card-top"><span className="wb-card-label">Dispositivos</span><span className="wb-icon" aria-hidden="true">◷</span></div>
      <div><div className="wb-card-value">{info.deviceCount?info.deviceCount+" registros":"Sin conexión"}</div><p className="wb-card-detail">{info.deviceCount?"Registros de dispositivos disponibles. El detalle de sueño, recuperación y esfuerzo está en desarrollo.":"Sueño, recuperación y esfuerzo se mostrarán tras conectar o importar tus datos."}</p></div>
      <div className="wb-card-foot"><span className="wb-small-date">{info.deviceLatest?"Último: "+date(info.deviceLatest):"Sin sincronización"}</span><a className="wb-card-link" href="/dispositivos">Explorar ↗</a></div>
    </article>
    <article className="wb-card wb-summary-card"><div className="wb-card-top"><span className="wb-card-label">Hábitos</span><span className="wb-icon" aria-hidden="true">◎</span></div>
      <div><div className="wb-card-value">{info.goals.length?info.goals.length+" objetivos":"Por descubrir"}</div><p className="wb-card-detail">{info.goals.length?"Objetivos declarados en tu perfil. El seguimiento de hábitos y cumplimiento aún no está disponible.":"Comienza definiendo tus objetivos. El diario y la consistencia semanal se incorporarán próximamente."}</p></div>
      <div className="wb-card-foot"><span className="wb-small-date">Seguimiento aún no disponible</span><a className="wb-card-link" href="/habitos">Explorar ↗</a></div>
    </article>
   </section>
   <section aria-label="Evolución y prioridades"><div className="wb-section-head"><h2>Tu panorama personal</h2><span className="wb-inline-label">Solo información disponible</span></div>
    <div className="wb-lower-grid">
     <article className="wb-card"><h3 className="wb-panel-title">Evolución de mi bienestar</h3><p className="wb-panel-sub">Tendencias de las tres áreas, con sus unidades y períodos de referencia.</p>
       <div className="wb-empty-chart"><strong>Gráficas en preparación</strong><p>Al contar con series comparables y reglas aprobadas, podrás consultar cambios reales en el tiempo, sin índices artificiales.</p></div>
     </article>
     <article className="wb-card"><h3 className="wb-panel-title">Tus próximas acciones</h3><p className="wb-panel-sub">Hasta tres pasos de configuración, sin interpretarlos como alertas médicas.</p>
      <div className="wb-priorities">{needs.length?needs.map((item,i)=><div className="wb-priority" key={item.label}><span className="wb-priority-icon">{i+1}</span><div>{item.text}<br/><a href={item.href}>{item.label} ↗</a></div></div>):<div className="wb-priority"><span className="wb-priority-icon">✓</span><div>Tu información inicial está disponible. Las prioridades científicas aparecerán cuando el motor de interpretación esté validado.</div></div>}</div>
     </article>
    </div>
   </section>
   <section className="wb-ai-card" aria-label="WELLNESS Intelligence"><div className="wb-ai-mark" aria-hidden="true">✳</div><div><strong>WELLNESS Intelligence</strong><p>Explicaciones con evidencia científica y contexto autorizado. Función en preparación.</p></div><a href="/inteligencia">Conocer más ↗</a></section>
   <p style={{fontSize:11,color:"#928E98",lineHeight:1.6,marginTop:20}}>Las cantidades mostradas corresponden únicamente a registros disponibles en tu cuenta. No representan diagnósticos, puntuaciones de salud ni resultados clínicos interpretados.</p>
  </>}
 </main>
}
