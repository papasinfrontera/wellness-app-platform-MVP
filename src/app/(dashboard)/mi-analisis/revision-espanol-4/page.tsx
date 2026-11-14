import catalog from "../catalog-reference.json";
import "../analisis.css";
type Entry={id:number;name:string;name_en?:string;aliases?:string[];code?:string};
const batch=new Set([28,35,39,52,53,54,55,56,57,58,59,60,61,62,63,64]);
const items=(catalog as Entry[]).filter(x=>batch.has(x.id));
export default function FourthBatchReview(){return <main className="wa-page">
<a href="/mi-analisis" className="wa-back">‹ Volver a Mis análisis</a>
<span className="wa-eyebrow">SPRINT 6.5-D.4 · REVISIÓN TERMINOLÓGICA</span>
<h1 className="wa-title">Cuarto lote: 16 indicadores en español</h1>
<p className="wa-subtitle">Análisis bioquímicos e indicadores derivados. Se conservan códigos, nombres originales en inglés y sinónimos para revisar antes de aprobar las equivalencias.</p>
<div className="wa-metrics" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginTop:21}}>
<article className="wa-metric"><strong className="wa-metric-number">16</strong><span className="wa-metric-label">Nuevas traducciones</span></article>
<article className="wa-metric"><strong className="wa-metric-number">64</strong><span className="wa-metric-label">Traducidos acumulados</span></article>
<article className="wa-metric"><strong className="wa-metric-number">64</strong><span className="wa-metric-label">Pendientes</span></article></div>
<div className="wa-explorer" style={{marginTop:15}}><h2>Equivalencias para aprobación</h2>
<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:650,fontSize:12}}>
<thead><tr style={{background:"#f0eaff",textAlign:"left"}}><th style={{padding:13}}>Código</th><th style={{padding:13}}>Nombre español propuesto</th><th style={{padding:13}}>Original en inglés</th><th style={{padding:13}}>Sinónimos provisionales</th></tr></thead>
<tbody>{items.map(x=><tr key={x.id} style={{verticalAlign:"top",borderBottom:"1px solid #eeedf4"}}><td style={{padding:13,color:"#5B40F5",fontWeight:800}}>{x.code}</td><td style={{padding:13,fontWeight:700}}>{x.name}</td><td style={{padding:13}}>{x.name_en}</td><td style={{padding:13,color:"#767086"}}>{(x.aliases||[]).join(", ")}</td></tr>)}</tbody></table></div></div>
<p className="wa-disclaimer">Los nombres son propuestas editoriales sujetas a validación. FIB-4, calcio corregido, índice SII y otras variables derivadas no sustituyen resultados directos. La aplicación no calcula ni interpreta sus valores en este sprint.</p>
<a className="wb-action" href="/mi-analisis">Ver catálogo completo ↗</a>
</main>}