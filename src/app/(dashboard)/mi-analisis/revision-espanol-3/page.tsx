import catalog from "../catalog-reference.json";
import "../analisis.css";
type Entry={id:number;name:string;name_en?:string;aliases?:string[];code?:string};
const batch=new Set([2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18]);
const items=(catalog as Entry[]).filter(x=>batch.has(x.id));
export default function ThirdReview(){return <main className="wa-page">
<a className="wa-back" href="/mi-analisis">‹ Volver a Mis análisis</a>
<span className="wa-eyebrow">SPRINT 6.5-D.3 · REVISIÓN TERMINOLÓGICA</span>
<h1 className="wa-title">Tercer lote: 16 indicadores en español</h1>
<p className="wa-subtitle">Perfil lipídico, índices derivados y otros análisis bioquímicos. Se conservan nombres originales, claves e identidad individual de cada indicador.</p>
<div className="wa-metrics" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginTop:21}}>
<article className="wa-metric"><strong className="wa-metric-number">16</strong><span className="wa-metric-label">Nuevos en español</span></article>
<article className="wa-metric"><strong className="wa-metric-number">48</strong><span className="wa-metric-label">Traducidos acumulados</span></article>
<article className="wa-metric"><strong className="wa-metric-number">80</strong><span className="wa-metric-label">Pendientes</span></article>
</div>
<div className="wa-explorer" style={{marginTop:15}}><h2>Equivalencias propuestas para aprobación</h2>
<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:650,fontSize:12}}>
<thead><tr style={{background:"#f0eaff",textAlign:"left"}}><th style={{padding:13}}>Código</th><th style={{padding:13}}>Español</th><th style={{padding:13}}>Inglés original</th><th style={{padding:13}}>Sinónimos provisionales</th></tr></thead>
<tbody>{items.map(x=><tr key={x.id} style={{verticalAlign:"top",borderBottom:"1px solid #eeedf4"}}><td style={{padding:13,fontWeight:800,color:"#5B40F5"}}>{x.code}</td><td style={{padding:13,fontWeight:700}}>{x.name}</td><td style={{padding:13}}>{x.name_en}</td><td style={{padding:13,color:"#767086"}}>{(x.aliases||[]).join(", ")}</td></tr>)}</tbody></table></div></div>
<p className="wa-disclaimer">«Glucosa media estimada» no equivale a una medición directa de glucosa. Los resultados de laboratorio todavía requieren comprobación de muestra, unidad y método; no se han aprobado equivalencias clínicas, intervalos de referencia ni reglas automáticas.</p>
<a className="wb-action" href="/mi-analisis">Volver al catálogo completo ↗</a>
</main>}