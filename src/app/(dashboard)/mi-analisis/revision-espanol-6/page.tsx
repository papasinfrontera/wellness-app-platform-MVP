import catalog from "../catalog-reference.json";
import "../analisis.css";
type Entry={id:number;name:string;name_en?:string;aliases?:string[];code?:string};
const items=(catalog as Entry[]).filter(x=>x.id>=81&&x.id<=96);
export default function SixthReview(){return <main className="wa-page">
<a href="/mi-analisis" className="wa-back">‹ Volver a Mis análisis</a>
<span className="wa-eyebrow">SPRINT 6.5-D.6 · REVISIÓN TERMINOLÓGICA</span>
<h1 className="wa-title">Sexto lote: 16 indicadores en español</h1>
<p className="wa-subtitle">Hormonas tiroideas y reproductivas, nutrición y metabolismo. Se mantienen los nombres originales en inglés, los sinónimos provisionales y los identificadores invariables.</p>
<div className="wa-metrics" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginTop:21}}>
<article className="wa-metric"><strong className="wa-metric-number">16</strong><span className="wa-metric-label">Nuevas traducciones</span></article>
<article className="wa-metric"><strong className="wa-metric-number">96</strong><span className="wa-metric-label">Traducidos acumulados</span></article>
<article className="wa-metric"><strong className="wa-metric-number">32</strong><span className="wa-metric-label">Pendientes</span></article></div>
<div className="wa-explorer" style={{marginTop:15}}><h2>Equivalencias propuestas para aprobación</h2>
<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:660,fontSize:12}}>
<thead><tr style={{background:"#f0eaff",textAlign:"left"}}><th style={{padding:13}}>Código</th><th style={{padding:13}}>Español propuesto</th><th style={{padding:13}}>Inglés original</th><th style={{padding:13}}>Sinónimos provisionales</th></tr></thead>
<tbody>{items.map(x=><tr key={x.id} style={{verticalAlign:"top",borderBottom:"1px solid #eeedf4"}}><td style={{padding:13,fontWeight:800,color:"#5B40F5"}}>{x.code}</td><td style={{padding:13,fontWeight:700}}>{x.name}</td><td style={{padding:13}}>{x.name_en}</td><td style={{padding:13,color:"#767086"}}>{(x.aliases||[]).join(", ")}</td></tr>)}</tbody></table></div></div>
<p className="wa-disclaimer">Las denominaciones se presentan para revisión terminológica y científica. Se mantienen separados T3 libre/T4 libre, testosterona libre/testosterona libre calculada, hierro/saturación de transferrina. La equivalencia definitiva para datos PDF requiere comprobar método, muestra y unidad.</p>
<a className="wb-action" href="/mi-analisis">Consultar catálogo completo ↗</a>
</main>}