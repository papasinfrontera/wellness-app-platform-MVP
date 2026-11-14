const blocks=[
{title:"Memoria longitudinal",status:"Esquema preparado",description:"Observaciones por usuario, indicador, fecha, unidad, fuente y estado de revisión."},
{title:"Documentos privados",status:"Esquema preparado",description:"PDF de laboratorio, exportaciones WHOOP y trazabilidad al archivo original."},
{title:"WHOOP",status:"Estructura preparada",description:"Ciclos fisiológicos, sueño, recuperación y entrenamientos con deduplicación."},
{title:"Base científica RAG",status:"Esquema preparado",description:"Fuentes versionadas, fragmentos científicos, vectores y estados de aprobación."},
{title:"Clinical Rules",status:"Esquema preparado",description:"Reglas versionadas y aprobadas, separadas de la IA conversacional."},
{title:"Supabase en ejecución",status:"Pendiente de conexión",description:"Falta crear o vincular un proyecto Supabase y configurar las credenciales en Vercel."}
];
export const metadata={title:"WELLNESS APP · Sprint 6.2"};
export default function Sprint62(){return <main style={{maxWidth:1020,margin:"auto",padding:"48px 20px 90px"}}>
<a href="/" style={{color:"#6845eb",textDecoration:"none",fontSize:13}}>← Volver al inicio</a>
<p style={{fontSize:12,letterSpacing:2,color:"#7051dc",fontWeight:800,marginTop:36}}>WELLNESS APP · SPRINT 6.2</p>
<h1 style={{fontSize:"clamp(30px,5vw,48px)",letterSpacing:-1.2,lineHeight:1.15,margin:"8px 0 14px"}}>La memoria de tu bienestar comienza aquí.</h1>
<p style={{fontSize:16,color:"#6d6880",maxWidth:760,lineHeight:1.65}}>Preparamos una infraestructura para conservar tus análisis, integrar métricas de WHOOP y sustentar WELLNESS Intelligence con evidencia científica. Esta es una vista técnica del desarrollo, no una base de datos conectada todavía.</p>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:16,marginTop:30}}>
{blocks.map(b=><section key={b.title} style={{border:"1px solid #e6e1f5",borderRadius:16,padding:22,background:"#fff"}}>
<span style={{fontSize:11,color:b.status.startsWith("Pendiente")?"#9a6b20":"#7354b8",fontWeight:700}}>{b.status}</span>
<h2 style={{fontSize:20,margin:"10px 0 8px",letterSpacing:-.3}}>{b.title}</h2><p style={{fontSize:14,color:"#77718a",lineHeight:1.5,margin:0}}>{b.description}</p></section>)}</div>
<section style={{background:"#f1edfc",padding:24,borderRadius:16,marginTop:24}}><h2 style={{fontSize:20,margin:"0 0 8px"}}>Siguiente validación</h2><p style={{color:"#57516d",lineHeight:1.6,margin:0}}>Crear el proyecto Supabase, ejecutar las migraciones tras la revisión de seguridad, conectar la aplicación y probar que cada usuario consulta exclusivamente sus propias mediciones.</p></section>
<p style={{marginTop:24}}><a href="/sprint-6-2/persistencia" style={{background:"#6944e8",color:"white",padding:"12px 18px",display:"inline-block",textDecoration:"none",borderRadius:10}}>Probar autenticación y persistencia ficticia</a></p></main>}
