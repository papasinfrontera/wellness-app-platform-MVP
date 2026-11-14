import { checkDatabase } from "@/lib/supabase/health";
export const dynamic = "force-dynamic";
const checks = [
 {title:"Proyecto Vercel independiente", ok:true,detail:"El entorno de revisión se publica desde la rama del sprint."},
 {title:"Migración PostgreSQL versionada",ok:true,detail:"Esquema SQL en GitHub; todavía no aplicado."},
 {title:"Políticas RLS iniciales",ok:true,detail:"Definidas en SQL; pendientes de pruebas sobre una base de datos."},
 {title:"Importadores PDF y WHOOP",ok:false,detail:"Pendientes de implementación tras la conexión a la base."},
 {title:"Búsqueda científica RAG",ok:false,detail:"Esquema definido; sin documentos indexados ni embeddings."},
 {title:"Clinical Rules Engine",ok:false,detail:"Versionado conceptual; no activo."}
];
export default async function EstadoInfraestructura(){
 const db = await checkDatabase();
 const configured = db.configured;
 const rows=[...checks.slice(0,3),{title:"Supabase configurado",ok:configured,detail:configured?"Las variables están presentes en el entorno de Vercel.":"Faltan variables de entorno y un proyecto autorizado."},{title:"Conexión real a PostgreSQL",ok:db.schemaAccessible,detail:db.schemaAccessible?"API REST y tabla indicators verificadas con credencial publicable y acceso restringido.":"La API REST no confirmó todavía el acceso a la tabla indicators."},...checks.slice(3)];
 return <main style={{maxWidth:900,margin:"auto",padding:"48px 22px 80px"}}>
 <a href="/sprint-6-2" style={{fontSize:13,color:"#6e49d8",textDecoration:"none"}}>← Sprint 6.2</a>
 <p style={{fontSize:12,color:"#6e49d8",fontWeight:800,letterSpacing:2,marginTop:35}}>WELLNESS APP · AUDITORÍA DE FUNDACIONES</p>
 <h1 style={{fontSize:"clamp(30px,5vw,43px)",letterSpacing:-1,marginBottom:12}}>Estado real de la plataforma.</h1>
 <p style={{lineHeight:1.65,color:"#6c677a",marginBottom:26}}>Este panel distingue el código preparado de las funciones que todavía requieren una base de datos, permisos y verificaciones funcionales. No se muestran credenciales ni datos personales.</p>
 <div style={{display:"grid",gap:12}}>{rows.map(r=><section key={r.title} style={{border:"1px solid #e7e3f4",borderRadius:14,padding:"18px 20px",background:"white",display:"flex",alignItems:"start",gap:14}}>
 <span style={{color:r.ok?"#387858":"#a36f30",fontSize:22}} aria-hidden="true">{r.ok?"✓":"○"}</span><div><strong style={{fontSize:16}}>{r.title}</strong><p style={{fontSize:13,color:"#77738b",margin:"6px 0 0",lineHeight:1.5}}>{r.detail}</p></div></section>)}</div>
 <p style={{fontSize:12,color:"#77738b",marginTop:24}}>Las marcas verdes significan únicamente que el componente descrito está disponible en el código o despliegue; no acreditan validación clínica ni persistencia operativa.</p>
 </main>
}
