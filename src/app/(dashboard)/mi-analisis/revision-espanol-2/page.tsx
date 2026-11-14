import catalog from "../catalog-reference.json";
import "../analisis.css";
type Row={id:number;name:string;name_en?:string;aliases?:string[];code?:string};
const batch=new Set([25,31,32,37,38,40,41,43,44,45,46,47,48,49,50,51]);
const items=(catalog as Row[]).filter(x=>batch.has(x.id));
export default function ReviewBatchTwo(){return <main className="wa-page">
<a className="wa-back" href="/mi-analisis">‹ Volver a Mis análisis</a>
<span className="wa-eyebrow">SPRINT 6.5-D.2 · REVISIÓN TERMINOLÓGICA</span>
<h1 className="wa-title">Segundo lote: 16 indicadores en español</h1>
<p className="wa-subtitle">Predominan los análisis de hemograma y el diferencial de leucocitos. Se distingue explícitamente el porcentaje del recuento absoluto para evitar emparejamientos incorrectos durante la importación de PDF.</p>
<div className="wa-metrics" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginTop:21}}>
<article className="wa-metric"><strong className="wa-metric-number">16</strong><span className="wa-metric-label">Nuevas traducciones</span></article>
<article className="wa-metric"><strong className="wa-metric-number">32</strong><span className="wa-metric-label">Total traducido</span></article>
<article className="wa-metric"><strong className="wa-metric-number">96</strong><span className="wa-metric-label">Pendientes</span></article></div>
<div className="wa-explorer" style={{marginTop:15}}><h2>Equivalencias propuestas para validar</h2>
<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:650,fontSize:12}}>
<thead><tr style={{background:"#f0eaff",textAlign:"left"}}><th style={{padding:13}}>Código</th><th style={{padding:13}}>Nombre español</th><th style={{padding:13}}>Original inglés</th><th style={{padding:13}}>Sinónimos provisionales</th></tr></thead>
<tbody>{items.map(x=><tr key={x.id} style={{verticalAlign:"top",borderBottom:"1px solid #eeedf4"}}><td style={{padding:13,color:"#5B40F5",fontWeight:800}}>{x.code}</td><td style={{padding:13,fontWeight:700}}>{x.name}</td><td style={{padding:13}}>{x.name_en}</td><td style={{padding:13,color:"#767086"}}>{(x.aliases||[]).join(", ")}</td></tr>)}</tbody></table></div></div>
<p className="wa-disclaimer">Los nombres y sinónimos se presentan para revisión editorial y científica. No se han alterado las identificaciones del catálogo, los datos personales, las unidades ni los umbrales clínicos. El PDF se asociará a un indicador solo después de comprobar muestra, método y unidad.</p>
<a className="wb-action" href="/mi-analisis">Revisar catálogo completo ↗</a>
</main>}