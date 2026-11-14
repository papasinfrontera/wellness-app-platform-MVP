import catalog from "../catalog-reference.json";
import "../analisis.css";
type Row={id:number;name:string;name_en?:string;aliases?:string[];code?:string};
const translated=(catalog as Row[]).filter(x=>x.name_en);
export default function SpanishBatchReview(){
return <main className="wa-page">
 <a className="wa-back" href="/mi-analisis">‹ Volver a Mis análisis</a>
 <span className="wa-eyebrow">SPRINT 6.5-D.1 · VALIDACIÓN TERMINOLÓGICA</span>
 <h1 className="wa-title">Primer lote: 16 indicadores en español</h1>
 <p className="wa-subtitle">Se mantienen los nombres originales en inglés y los identificadores técnicos. Los sinónimos son provisionales, pendientes de revisión, y no aprueban automáticamente resultados de un PDF.</p>
 <div className="wa-metrics" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginTop:21}}>
  <article className="wa-metric"><strong className="wa-metric-number">16</strong><span className="wa-metric-label">Traducidos en este lote</span></article>
  <article className="wa-metric"><strong className="wa-metric-number">128</strong><span className="wa-metric-label">Indicadores conservados</span></article>
  <article className="wa-metric"><strong className="wa-metric-number">112</strong><span className="wa-metric-label">Pendientes de revisión</span></article>
 </div>
 <div className="wa-explorer" style={{marginTop:15}}>
 <h2>Equivalencias para aprobar</h2>
 <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:640}}>
 <thead><tr style={{background:"#f0eaff",textAlign:"left"}}><th style={{padding:13}}>Código</th><th style={{padding:13}}>Español propuesto</th><th style={{padding:13}}>Original en inglés</th><th style={{padding:13}}>Sinónimos del lote</th></tr></thead>
 <tbody>{translated.map(x=><tr key={x.id} style={{borderBottom:"1px solid #eeedf4",verticalAlign:"top"}}><td style={{padding:13,color:"#5B40F5",fontWeight:800}}>{x.code}</td><td style={{padding:13,fontWeight:700}}>{x.name}</td><td style={{padding:13}}>{x.name_en}</td><td style={{padding:13,color:"#767086"}}>{(x.aliases||[]).join(", ")}</td></tr>)}</tbody></table></div>
 </div>
 <p className="wa-disclaimer">Se han preservado las claves y las unidades existentes. Este lote no cambia rangos clínicos, cálculos PhenoAge, datos personales ni criterios científicos. El emparejamiento de PDF sigue exigiendo revisión y aprobación.</p>
 <a className="wb-action" href="/mi-analisis">Revisar catálogo completo ↗</a>
 </main>
}