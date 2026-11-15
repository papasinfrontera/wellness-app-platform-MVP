import catalog from "../catalog-reference.json";
import "../analisis.css";
type Entry={id:number;name:string;name_en?:string;aliases?:string[];code?:string};
const full=catalog as Entry[];
const items=full.filter(x=>x.id>=113&&x.id<=128);
export default function LastBatchReview(){return <main className="wa-page">
<a href="/mi-analisis" className="wa-back">‹ Volver a Mis análisis</a>
<span className="wa-eyebrow">SPRINT 6.5-D.8 · CIERRE DEL CATÁLOGO</span>
<h1 className="wa-title">Octavo lote: 16 indicadores en español</h1>
<p className="wa-subtitle">Última revisión de traducciones: PSA, hormonas, tiroides, vitaminas, reticulocitos y minerales. La nomenclatura bilingüe propuesta completa los 128 indicadores, sujeta a la validación terminológica y científica.</p>
<div className="wa-metrics" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginTop:21}}>
<article className="wa-metric"><strong className="wa-metric-number">16</strong><span className="wa-metric-label">Traducidos en este lote</span></article>
<article className="wa-metric"><strong className="wa-metric-number">128</strong><span className="wa-metric-label">Traducciones acumuladas</span></article>
<article className="wa-metric"><strong className="wa-metric-number">0</strong><span className="wa-metric-label">Pendientes de traducción inicial</span></article></div>
<div className="wa-explorer" style={{marginTop:15}}><h2>Equivalencias propuestas del último lote</h2>
<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:690,fontSize:12}}>
<thead><tr style={{background:"#f0eaff",textAlign:"left"}}><th style={{padding:13}}>Código</th><th style={{padding:13}}>Español propuesto</th><th style={{padding:13}}>Original en inglés</th><th style={{padding:13}}>Sinónimos provisionales</th></tr></thead>
<tbody>{items.map(x=><tr key={x.id} style={{verticalAlign:"top",borderBottom:"1px solid #eeedf4"}}><td style={{padding:13,fontWeight:800,color:"#5B40F5"}}>{x.code}</td><td style={{padding:13,fontWeight:700}}>{x.name}</td><td style={{padding:13}}>{x.name_en}</td><td style={{padding:13,color:"#767086"}}>{(x.aliases||[]).join(", ")}</td></tr>)}</tbody></table></div></div>
<div className="wa-explorer" style={{marginTop:14}}>
<h2>Comprobaciones antes de activar la importación PDF</h2>
<p className="wa-subtitle">El PSA libre porcentual, el PSA libre cuantitativo y el PSA total son pruebas distintas. La testosterona por inmunoensayo tampoco identifica automáticamente otro método analítico. «Vitamina D» exige confirmar en el informe si corresponde a 25-hidroxivitamina D u otra prueba. Las equivalencias de los 128 nombres siguen en estado provisional.</p>
</div>
<p className="wa-disclaimer">No se han incorporado resultados personales, rangos clínicos, unidades ni cálculos diagnósticos. El reconocimiento del PDF se realizará posteriormente con revisión humana de muestra, método, analito, unidad y fecha antes de guardar.</p>
<a className="wb-action" href="/mi-analisis">Revisar los 128 indicadores ↗</a>
</main>}