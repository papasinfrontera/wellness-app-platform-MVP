import catalog from "../catalog-reference.json";
import "../analisis.css";
type Entry={id:number;name:string;name_en?:string;aliases?:string[];code?:string};
const items=(catalog as Entry[]).filter(x=>x.id>=65&&x.id<=80);
export default function FifthReview(){return <main className="wa-page">
<a href="/mi-analisis" className="wa-back">‹ Volver a Mis análisis</a>
<span className="wa-eyebrow">SPRINT 6.5-D.5 · REVISIÓN TERMINOLÓGICA</span>
<h1 className="wa-title">Quinto lote: 16 indicadores en español</h1>
<p className="wa-subtitle">Analíticas renales, hormonales, bioquímicas y de ácidos grasos. Se mantienen los nombres originales y códigos estables. Los sinónimos son propuestas pendientes de validación.</p>
<div className="wa-metrics" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginTop:21}}>
<article className="wa-metric"><strong className="wa-metric-number">16</strong><span className="wa-metric-label">Nuevas traducciones</span></article>
<article className="wa-metric"><strong className="wa-metric-number">80</strong><span className="wa-metric-label">Traducidos acumulados</span></article>
<article className="wa-metric"><strong className="wa-metric-number">48</strong><span className="wa-metric-label">Pendientes</span></article>
</div>
<div className="wa-explorer" style={{marginTop:15}}><h2>Equivalencias propuestas para aprobación</h2>
<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:660,fontSize:12}}>
<thead><tr style={{background:"#f0eaff",textAlign:"left"}}><th style={{padding:13}}>Código</th><th style={{padding:13}}>Español propuesto</th><th style={{padding:13}}>Inglés original</th><th style={{padding:13}}>Sinónimos provisionales</th></tr></thead>
<tbody>{items.map(x=><tr key={x.id} style={{verticalAlign:"top",borderBottom:"1px solid #eeedf4"}}><td style={{padding:13,fontWeight:800,color:"#5B40F5"}}>{x.code}</td><td style={{padding:13,fontWeight:700}}>{x.name}</td><td style={{padding:13}}>{x.name_en}</td><td style={{padding:13,color:"#767086"}}>{(x.aliases||[]).join(", ")}</td></tr>)}</tbody></table></div></div>
<p className="wa-disclaimer">Se distinguen el filtrado glomerular estimado por cistatina C, el filtrado estimado general y la medición de cistatina C. Antes de importar un PDF, el sistema deberá validar el método, la muestra, las unidades y las referencias; no se emparejan automáticamente por texto ambiguo.</p>
<a className="wb-action" href="/mi-analisis">Consultar el catálogo completo ↗</a>
</main>}