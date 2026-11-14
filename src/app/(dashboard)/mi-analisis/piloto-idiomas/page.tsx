"use client";
import {useMemo,useState} from "react";
import {recognizePilotLabel} from "../../../../lib/indicator-label-pilot";
import "../analisis.css";
const examples=["Apolipoprotein B (ApoB)","Apolipoproteína B","ApoB","Glucose","Glucosa","Glicemia","Glucose urine"];
export default function PilotPage(){
 const [label,setLabel]=useState("Glucose");
 const result=useMemo(()=>recognizePilotLabel(label),[label]);
 return <main className="wa-page wa-detail-shell">
  <a className="wa-back" href="/mi-analisis">‹ Volver a mis análisis</a>
  <span className="wa-eyebrow">SPRINT 6.5-D.0 · PILOTO CONTROLADO</span>
  <h1 className="wa-detail-title">Indicadores en español</h1>
  <p className="wa-subtitle">Prueba del reconocimiento bilingüe de ApoB y Glucosa. Los nombres del laboratorio se conservan; este simulador no procesa archivos PDF ni guarda resultados.</p>
  <section className="wa-detail-metrics" style={{gridTemplateColumns:"repeat(auto-fit,minmax(235px,1fr))"}}>
   <article className="wa-detail-metric"><h3>Nombre principal</h3><strong style={{fontSize:21}}>Apolipoproteína B (ApoB)</strong><p className="wa-future">Apolipoprotein B (ApoB) · Código REF-001</p></article>
   <article className="wa-detail-metric"><h3>Nombre principal</h3><strong style={{fontSize:25}}>Glucosa</strong><p className="wa-future">Glucose · Código REF-017</p></article>
  </section>
  <section className="wa-range-card">
   <h2>Probar una etiqueta extraída de un PDF</h2>
   <label htmlFor="pilot-lab-name" style={{display:"block",fontWeight:700,fontSize:12,marginBottom:8}}>Nombre tal como aparece en el laboratorio</label>
   <input id="pilot-lab-name" type="text" value={label} maxLength={180} onChange={e=>setLabel(e.target.value)} className="wa-search" style={{margin:"0 0 12px"}} />
   <div className="wa-pills" style={{marginBottom:17}}>{examples.map(item=><button key={item} type="button" className="wa-pill" onClick={()=>setLabel(item)}>{item}</button>)}</div>
   <div style={{background:result.status==="candidate"?"#EFFBDD":"#F7F4FB",borderRadius:13,padding:18}}>
    <strong style={{display:"block",fontSize:15}}>{result.status==="candidate"?"Coincidencia propuesta · pendiente de aprobación":"Revisión manual requerida"}</strong>
    {result.status==="candidate"&&<p style={{fontSize:19,fontWeight:800,margin:"9px 0 3px"}}>{result.name_es} <span style={{fontSize:12,color:"#5B40F5"}}>{result.code}</span></p>}
    <p style={{fontSize:12,color:"#656073",lineHeight:1.7,margin:"9px 0 0"}}>{result.reason}</p>
   </div>
   <p className="wa-disclaimer">El reconocimiento del nombre no demuestra que dos pruebas sean clínicamente equivalentes. Antes de incorporar un resultado deben verificarse muestra, método, unidad, fecha, paciente y documento original. Las equivalencias del piloto aún requieren aprobación editorial y científica.</p>
  </section>
 </main>
}
