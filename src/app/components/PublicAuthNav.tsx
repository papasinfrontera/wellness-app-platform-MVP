"use client";
import {useWellnessAuth} from "./WellnessAuthProvider";
import {useEffect,useState} from "react";

export default function PublicAuthNav(){
 const {status,identity,user}=useWellnessAuth();
 const [photoError,setPhotoError]=useState(false);
 useEffect(()=>setPhotoError(false),[identity.avatarUrl]);
 const name=identity.firstName||"Mi perfil";
 const initials=(identity.firstName.charAt(0)+identity.lastName.charAt(0)).toUpperCase()||"◉";
 return <nav className="well-nav" aria-label="Navegación principal">
  <a href="/">Inicio</a>
  {status==="signed_in"&&user?<>
   <a href="/mi-bienestar">Mi bienestar</a>
   <a href="/mi-perfil" aria-label={"Mi perfil, "+name} style={{display:"inline-flex",alignItems:"center",gap:7}}>
    <span style={{width:28,height:28,borderRadius:"50%",background:"#EDE8FF",color:"#5B40F5",display:"inline-grid",placeItems:"center",overflow:"hidden",fontSize:10,fontWeight:800}}>
     {identity.avatarUrl&&!photoError?<img alt="" onError={()=>setPhotoError(true)} src={identity.avatarUrl} width={28} height={28} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}
    </span>{name}
   </a>
  </>:status==="loading"?<span role="status" style={{fontSize:12,color:"#777085"}}>Verificando sesión…</span>:<>
   <a href="/sprint-6-2/persistencia">Acceder</a>
  </>}
 </nav>;
}
