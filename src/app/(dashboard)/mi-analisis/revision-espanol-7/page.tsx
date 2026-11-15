import catalog from "../catalog-reference.json";
import "../analisis.css";
type Entry={id:number;name:string;name_en?:string;aliases?:string[];code?:string};
const items=(catalog as Entry[]).filter(x=>x.id>=97&&x.id<=112);
export default function SeventhReview(){return <main className="wa-page">
<a href="/mi-analisis" className="wa-back">‹ Volver a Mis análisis</a>
<span className="wa-eyebrow">SPRINT 6.5-D.7 · REVISIÓN TERMINOLÓGICA</span>
<h1 className="wa-title">Séptimo lote: 16 indicadores en español</h1>
<p className="wa-subtitle">Subfracciones LDL, ácidos grasos omega y PSA. Se conservan los nombres originales en inglés, los códigos técnicos y los sinónimos provisionales para revisión científica.</p>
<div className="wa-metrics" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginTop:21}}>
<article className="wa-metric"><strong className="wa-metric-number">16</strong><span className="wa-metric-label">Nuevas traducciones</span></article>
<article className="wa-metric"><strong className="wa-metric-number">112</strong><span className="wa-metric-label">Traducidos acumulados</span></article>
<article className="wa-metric"><strong className="wa-metric-number">16</strong><span className="wa-metric-label">Pendientes</span></article>
</div>
<div className="wa-explorer" style={{marginTop:15}}><h2>Equivalencias propuestas para aprobación</h2>
<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:680,fontSize:12}}>
<thead><tr style={{background:"#f0eaff",textAlign:"left"}}><th style={{padding:13}}>Código</th><th style={{padding:13}}>Español propuesto</th><th style={{padding:13}}>Inglés original</th><th style={{padding:13}}>Sinónimos provisionales</th></tr></thead>
<tbody>{items.map(x=><tr key={x.id} style={{verticalAlign:"top",borderBottom:"1px solid #eeedf4"}}><td style={{padding:13,fontWeight:800,color:"#5B40F5"}}>{x.code}</td><td style={{padding:13,fontWeight:700}}>{x.name}</td><td style={{padding:13}}>{x.name_en}</td><td style={{padding:13,color:"#767086"}}>{(x.aliases||[]).join(", ")}</td></tr>)}</tbody></table></div></div>
<p className="wa-disclaimer">La proporción de PSA libre es diferente de su concentración absoluta. El número, tamaño y patrón de partículas LDL también representan parámetros separados. No se han configurado equivalencias automáticas de resultados de PDF, rangos ni fórmulas clínicas.</p>
<a className="wb-action" href="/mi-analisis">Consultar catálogo completo ↗</a>
</main>}