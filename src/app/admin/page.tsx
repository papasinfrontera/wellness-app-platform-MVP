"use client";
import {useEffect,useState} from "react";
import {createClient,type User} from "@supabase/supabase-js";

const sections=[
{name:"Usuarios",icon:"users",description:"Cuentas, estados y gestión autorizada"},
{name:"Profesionales",icon:"stethoscope",description:"Marketplace, validación y agenda"},
{name:"Membresías y tarifas",icon:"credit-card",description:"Planes, precios y beneficios"},
{name:"Paquetes de análisis",icon:"layers",description:"Composición y disponibilidad comercial"},
{name:"Pruebas adicionales",icon:"flask-conical",description:"Catálogo de pruebas contratables"},
{name:"Promociones",icon:"ticket",description:"Descuentos y vigencias"},
{name:"Órdenes y pagos",icon:"receipt",description:"Contrataciones y conciliación"},
{name:"Ciencia",icon:"book-open-check",description:"Reglas y contenido sujetos a validación"},
{name:"Inteligencia",icon:"brain-circuit",description:"Evaluaciones, evidencias y límites"},
{name:"Seguridad",icon:"shield-check",description:"Permisos y auditoría"}
];
type Status="checking"|"unauthenticated"|"denied"|"allowed"|"error";
export default function AdminHome(){
 const [status,setStatus]=useState<Status>("checking");
 const [role,setRole]=useState("");
 const [email,setEmail]=useState("");
 useEffect(()=>{
  let alive=true;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){setStatus("error");return}
  const supabase=createClient(url,key);
  void (async()=>{
   try{
    const {data:{user},error}=await supabase.auth.getUser();
    if(!alive)return;
    if(error||!user){setStatus("unauthenticated");return}
    setEmail(user.email||"");
    const res=await supabase.from("platform_admin_roles").select("role,is_active").eq("user_id",user.id).maybeSingle();
    if(!alive)return;
    if(res.error){setStatus("error");return}
    if(!res.data?.is_active){setStatus("denied");return}
    setRole(res.data.role);
    setStatus("allowed");
   }catch{if(alive)setStatus("error")}
  })();
  return()=>{alive=false};
 },[]);
 const box={border:"1px solid #E9E7EF",background:"#FFFFFF",borderRadius:20,padding:24} as const;
 return <main style={{maxWidth:1140,margin:"0 auto",padding:"54px 22px 100px",color:"#161620"}}>
   <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:15}}>
    <span style={{display:"grid",placeItems:"center",width:42,height:42,borderRadius:13,background:"#5B40F5",color:"white",fontWeight:800}}>W</span>
    <strong style={{letterSpacing:".07em",fontSize:12}}>WELLNESS ADMIN</strong>
   </div>
   <h1 style={{fontSize:"clamp(30px,4vw,48px)",letterSpacing:"-.04em",margin:"14px 0 12px"}}>Administración de la plataforma</h1>
   <p style={{color:"#75727D",maxWidth:650,lineHeight:1.6,marginBottom:30}}>Un espacio reservado para supervisar el funcionamiento de WELLNESS APP. Los datos personales de salud no se muestran en esta consola.</p>
   {status==="checking"&&<div style={box} role="status">Verificando autorización…</div>}
   {status==="unauthenticated"&&<div style={box}><h2 style={{fontSize:19}}>Acceso protegido</h2><p>Inicia sesión con una cuenta autorizada para acceder.</p><a href="/sprint-6-2/persistencia" style={{color:"#5B40F5",fontWeight:700}}>Ir a iniciar sesión →</a></div>}
   {status==="denied"&&<div style={box}><h2 style={{fontSize:19}}>Sin permisos administrativos</h2><p>Tu cuenta no tiene un rol administrativo activo. Este acceso debe ser concedido a través del proceso de seguridad de la plataforma.</p><a href="/" style={{color:"#5B40F5"}}>Volver al inicio</a></div>}
   {status==="error"&&<div style={box}><h2 style={{fontSize:19}}>No se pudo verificar el acceso</h2><p>No mostraremos la consola hasta confirmar tus permisos. Inténtalo de nuevo más tarde.</p></div>}
   {status==="allowed"&&<div>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:24}}>
       <div><span style={{fontSize:12,color:"#777"}}>Sesión autorizada</span><div style={{fontWeight:700}}>{email}</div></div>
       <div style={{padding:"9px 14px",borderRadius:99,background:"#CFFF4C",fontSize:12,fontWeight:800}}>Rol: {role.replaceAll("_"," ")}</div>
     </div>
     <div style={{...box,marginBottom:25,background:"#F7F6FC"}}><strong>Vista inicial</strong><p style={{color:"#6C6B78",margin:"9px 0 0",fontSize:14,lineHeight:1.6}}>La estructura de gestión está preparada. Los controles operativos estarán disponibles tras completar permisos, auditoría y pruebas específicas. No se presentan cifras simuladas.</p></div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:13}}>
       {sections.map(s=><article key={s.name} style={{...box,minHeight:145,display:"flex",flexDirection:"column",gap:11}}>
         <div style={{width:34,height:5,borderRadius:99,background:"#5B40F5"}}/>
         <strong style={{fontSize:16}}>{s.name}</strong>
         <p style={{color:"#77747F",fontSize:13,lineHeight:1.5,margin:0}}>{s.description}</p>
         <span style={{fontSize:11,color:"#8A8792",marginTop:"auto"}}>Próxima implementación</span>
       </article>)}
     </div>
   </div>}
   <p style={{marginTop:28,fontSize:12,color:"#8A8792"}}>La administración comercial no modifica reglas científicas. El acceso a información médica requiere permisos separados y justificados.</p>
 </main>;
}
