"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {useWellnessAuth} from "../../components/WellnessAuthProvider";

type UserRow={id:string;email:string|null;created_at:string;email_confirmed:boolean;last_sign_in_at:string|null;admin_role:string|null};
type Response={page:number;perPage:number;total:number|null;users:UserRow[];error?:string};
type Status="loading"|"signin"|"mfa"|"denied"|"error"|"ready";
const shell={maxWidth:1120,margin:"0 auto",padding:"48px 22px 95px",color:"#201831"};
const surface={background:"#fff",border:"1px solid #E7E3F1",borderRadius:17,padding:20};
const date=(iso:string|null)=>iso?new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(iso)):"Nunca";
export default function AdminUsers(){
 const {client,user,status:authStatus}=useWellnessAuth();
 const [page,setPage]=useState(1);
 const [filter,setFilter]=useState("");
 const [status,setStatus]=useState<Status>("loading");
 const [result,setResult]=useState<Response|null>(null);
 const [error,setError]=useState("");
 const [refresh,setRefresh]=useState(0);
 const fetchData=useCallback(async()=>{
  if(authStatus==="loading"){setStatus("loading");return}
  if(!client||!user||authStatus!=="signed_in"){setStatus("signin");setResult(null);return}
  setStatus("loading");setError("");
  try{
   const {data:{session},error:sessionError}=await client.auth.getSession();
   if(sessionError||!session?.access_token){setStatus("signin");return}
   const response=await fetch("/api/admin/users?page="+page,{
    method:"GET",headers:{Authorization:"Bearer "+session.access_token},
    credentials:"same-origin",cache:"no-store"
   });
   const payload=await response.json() as Response;
   if(response.status===401){setStatus("signin");return}
   if(response.status===403){
    setStatus(payload.error?.includes("dos pasos")?"mfa":"denied");return;
   }
   if(!response.ok){setError(payload.error||"No fue posible consultar usuarios.");setStatus("error");return}
   setResult(payload);setStatus("ready");
  }catch{setError("No fue posible obtener la información administrativa.");setStatus("error")}
 },[authStatus,client,user,page]);
 useEffect(()=>{void fetchData()},[fetchData,refresh]);
 const visible=useMemo(()=>result?.users.filter(row=>!filter.trim()||(row.email||"").toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase()))||[],[result,filter]);
 const total=result?.total;
 const hasNext=typeof total==="number"?page*20<total:(result?.users.length||0)===20;
 return <main style={shell}>
  <a href="/admin" style={{fontSize:12,color:"#5B40F5",fontWeight:800}}>‹ Volver a WELLNESS ADMIN</a>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:12,margin:"24px 0",flexWrap:"wrap"}}>
   <div><span style={{fontSize:11,fontWeight:800,color:"#7355D8",letterSpacing:".09em"}}>WELLNESS ADMIN · IDENTIDAD</span>
    <h1 style={{fontSize:"clamp(28px,4vw,40px)",letterSpacing:"-.04em",margin:"7px 0"}}>Gestión de usuarios</h1>
    <p style={{fontSize:13,color:"#777087",lineHeight:1.6,maxWidth:690}}>Directorio de cuentas y roles. Los datos de laboratorio, hábitos, fotografías y antecedentes de salud permanecen fuera de esta vista.</p>
   </div>
   <button type="button" onClick={()=>setRefresh(n=>n+1)} disabled={status==="loading"} style={{padding:"10px 14px",background:"#F4F0FF",border:"1px solid #D9D0FA",borderRadius:10,fontWeight:700,color:"#5B40F5",cursor:"pointer"}}>Actualizar</button>
  </div>
  {status==="loading"&&<div role="status" style={surface}>Verificando permisos y consultando cuentas…</div>}
  {status==="signin"&&<div role="status" style={surface}>Inicia sesión para acceder. <a href="/sprint-6-2/persistencia">Ir al acceso</a></div>}
  {status==="mfa"&&<div role="status" style={surface}>Se requiere autenticación en dos pasos. <a href="/admin">Completar verificación administrativa</a></div>}
  {status==="denied"&&<div role="alert" style={surface}>Acceso restringido. Esta sección está reservada a superadministradores activos.</div>}
  {status==="error"&&<div role="alert" style={surface}>{error} <button type="button" onClick={()=>setRefresh(n=>n+1)}>Reintentar</button></div>}
  {status==="ready"&&result&&<section style={surface}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginBottom:15}}>
    <div><strong style={{fontSize:17}}>{typeof total==="number"?total:"—"} cuentas</strong><p style={{fontSize:11,color:"#777087",margin:"4px 0"}}>Solo información de identidad y acceso</p></div>
    <label style={{fontSize:12,display:"grid",gap:5,fontWeight:700}}>Buscar en esta página
     <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Correo electrónico" aria-label="Buscar por correo en esta página" style={{padding:"10px 12px",minWidth:220,border:"1px solid #DBD5EB",borderRadius:9}}/>
    </label>
   </div>
   <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",minWidth:720,borderCollapse:"collapse",fontSize:12,textAlign:"left"}}>
     <thead><tr style={{background:"#F3EFFF"}}>{["Correo","Registro","Verificación","Último acceso","Rol administrativo"].map(h=><th key={h} scope="col" style={{padding:12,color:"#4C3C6A"}}>{h}</th>)}</tr></thead>
     <tbody>{visible.map(row=><tr key={row.id} style={{borderBottom:"1px solid #EEEAF7"}}>
      <td style={{padding:12,overflowWrap:"anywhere",fontWeight:700}}>{row.email||"Sin correo"}</td>
      <td style={{padding:12}}>{date(row.created_at)}</td>
      <td style={{padding:12}}>{row.email_confirmed?"Confirmado":"Pendiente"}</td>
      <td style={{padding:12}}>{date(row.last_sign_in_at)}</td>
      <td style={{padding:12}}>{row.admin_role?.replaceAll("_"," ")||"Usuario"}</td>
     </tr>)}</tbody>
    </table>
    {visible.length===0&&<p style={{fontSize:12,padding:15,color:"#777087"}}>No hay coincidencias en esta página.</p>}
   </div>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginTop:20,flexWrap:"wrap"}}>
    <button type="button" disabled={page<=1} onClick={()=>{setPage(n=>Math.max(1,n-1));setFilter("")}} style={{padding:"10px 14px",borderRadius:9,border:"1px solid #DDD5F2",background:"#fff"}}>Anterior</button>
    <span style={{fontSize:12,color:"#776E87"}}>Página {page}</span>
    <button type="button" disabled={!hasNext} onClick={()=>{setPage(n=>n+1);setFilter("")}} style={{padding:"10px 14px",borderRadius:9,border:"1px solid #DDD5F2",background:"#fff"}}>Siguiente</button>
   </div>
  </section>}
  <p style={{fontSize:11,color:"#847C91",marginTop:19}}>Vista de solo lectura. Invitaciones, suspensión de cuentas y cambios de roles requieren un flujo privilegiado adicional, con confirmaciones y auditoría.</p>
 </main>;
}
