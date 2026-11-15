import Link from "next/link";
import catalog from "../catalog-reference.json";
import "../analisis.css";
type Entry={id:number;code:string;name:string;name_en:string;aliases:string[]};
const rows=catalog as Entry[];
const issues=[
 {severity:"Bloqueante",ref:"REF-111 · REF-112",title:"PSA libre: porcentaje frente a concentración",detail:"Si se eliminan comas, signos % o paréntesis, «PSA %, Free» y «PSA, Free» producen la misma clave; «PSA libre (%)» y «PSA libre» también."},
 {severity:"Requiere contexto",ref:"REF-016 · REF-017",title:"Glucosa estimada frente a medición",detail:"Glucosa media estimada (eAG) no debe asignarse a una glucemia medida directamente."},
 {severity:"Requiere contexto",ref:"REF-071 · REF-072 · REF-078",title:"Cistatina C y filtrado glomerular estimado",detail:"Separar analito y cálculo según fórmula, muestra y técnica informada."},
 {severity:"Requiere contexto",ref:"REF-085 · REF-086 · REF-121 · REF-122",title:"Testosterona libre, calculada y métodos analíticos",detail:"Una etiqueta similar no demuestra equivalencia de fracción hormonal ni método."},
 {severity:"Requiere contexto",ref:"REF-127",title:"Vitamina D genérica",detail:"Confirmar si el informe mide 25-hidroxivitamina D, 1,25-dihidroxivitamina D u otra determinación."},
 {severity:"Requiere contexto",ref:"REF-066 · REF-081 · REF-069",title:"CO₂, folato y cortisol",detail:"Los resultados dependen del método, tipo de muestra, preparación y, para cortisol, hora de recogida."}
];
export default function AuditPage(){return <main className="wa-page">
 <Link className="wa-back" href="/mi-analisis">‹ Volver a Mis análisis</Link>
 <span className="wa-eyebrow">SPRINT 6.5-D.9 · AUDITORÍA INICIAL</span>
 <h1 className="wa-title">Auditoría de los 128 indicadores</h1>
 <p className="wa-subtitle">Análisis técnico de integridad, nomenclatura bilingüe y riesgo de identificación errónea. La auditoría no sustituye la validación del Consejo Médico-Científico.</p>
 <div className="wa-metrics" style={{gridTemplateColumns:"repeat(4,minmax(0,1fr))",marginTop:21}}>
 <article className="wa-metric"><strong className="wa-metric-number">{rows.length}</strong><span className="wa-metric-label">Nombres bilingües</span></article>
 <article className="wa-metric"><strong className="wa-metric-number">485</strong><span className="wa-metric-label">Alias registrados en Supabase</span></article>
 <article className="wa-metric"><strong className="wa-metric-number">2</strong><span className="wa-metric-label">Claves de PSA ambiguas</span></article>
 <article className="wa-metric"><strong className="wa-metric-number">0</strong><span className="wa-metric-label">LOINC y unidades asignadas</span></article></div>
 <div className="wa-explorer" style={{marginTop:16}}>
 <h2>Hallazgos que requieren decisión</h2>
 <p className="wa-subtitle">Las coincidencias de nombres son candidatos, no resultados validados. El reconocimiento automático deberá abstenerse cuando falten unidad, muestra, método o determinación analítica.</p>
 <div style={{display:"grid",gap:12,marginTop:15}}>{issues.map(x=><article key={x.ref} style={{padding:16,border:"1px solid #ece9f5",borderRadius:12}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"center"}}>
 <strong style={{color:"#4f35c7"}}>{x.title}</strong><span style={{background:x.severity==="Bloqueante"?"#fff0e9":"#f3efff",color:x.severity==="Bloqueante"?"#944422":"#5B40F5",padding:"5px 9px",borderRadius:9,fontSize:11,fontWeight:700}}>{x.severity}</span>
 </div><div style={{fontSize:11,fontWeight:700,marginTop:8,color:"#777187"}}>{x.ref}</div>
 <p style={{fontSize:12,lineHeight:1.75,margin:"7px 0 0"}}>{x.detail}</p>
 </article>)}</div></div>
 <div className="wa-explorer" style={{marginTop:16}}>
 <h2>Estado previo al importador PDF</h2>
 <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:480,fontSize:12}}>
 <tbody>{[
 ["Traducción del catálogo","128/128 completada técnicamente"],
 ["Código de identificación estable","128/128 sin duplicados"],
 ["Códigos LOINC validados","0/128 — pendiente"],
 ["Unidades canónicas validadas","0/128 — pendiente"],
 ["Colisiones detectadas","2 claves ambiguas de PSA"],
 ["Revisión científica formal","Pendiente"],
 ["Importador PDF completo","Pendiente — no se ha activado"],
 ["Datos personales","Sin modificación"]
 ].map(x=><tr key={x[0]} style={{borderBottom:"1px solid #eeedf4"}}><th style={{padding:12,textAlign:"left"}}>{x[0]}</th><td style={{padding:12}}>{x[1]}</td></tr>)}</tbody></table></div></div>
 <p className="wa-disclaimer">Fuente: catálogo local y verificaciones de Supabase del 14 de noviembre de 2026. Los dos conflictos son claves producidas por normalización de texto que elimina puntuación; no implica que los códigos originales sean duplicados. No se han cargado ni diagnosticado análisis personales.</p>
 <Link className="wb-action" href="/mi-analisis">Volver al catálogo completo ↗</Link>
 </main>}