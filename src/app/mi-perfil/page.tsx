"use client";
import {useEffect,useState} from "react";
import {useWellnessAuth} from "../components/WellnessAuthProvider";

type Profile={
 first_name:string;last_name:string;birth_date:string;sex_for_references:string;country:string;timezone:string;
 height_cm:string;weight_kg:string;activity_level:string;conditions:string;medications:string;allergies:string;history_notes:string;
 sleep_hours:string;exercise_frequency:string;nutrition_pattern:string;hydration:string;tobacco:string;alcohol:string;stress_level:string;
 goals:string[];communication_preference:string;ai_consent:boolean;ai_consent_at:string|null;photo_path:string|null;completed_step:number
};
const empty:Profile={first_name:"",last_name:"",birth_date:"",sex_for_references:"",country:"",timezone:"",height_cm:"",weight_kg:"",activity_level:"",conditions:"",medications:"",allergies:"",history_notes:"",sleep_hours:"",exercise_frequency:"",nutrition_pattern:"",hydration:"",tobacco:"",alcohol:"",stress_level:"",goals:[],communication_preference:"balanced",ai_consent:false,ai_consent_at:null,photo_path:null,completed_step:1};
const steps=["Identidad","Medidas","Mi salud","Mis hábitos","Objetivos"];
const goals=["Dormir mejor","Mejorar mi energía","Salud metabólica","Salud cardiovascular","Rendimiento físico","Prevención","Longevidad","Reducir el estrés"];
const inputStyle={width:"100%",padding:"13px 14px",border:"1px solid #dddde8",borderRadius:11,fontSize:14,color:"#161620",background:"white"} as const;
function Field({label,children}:{label:string;children:React.ReactNode}){return <label style={{display:"grid",gap:7,fontSize:13,fontWeight:600,color:"#161620"}}>{label}{children}</label>}
function normalize(row:Record<string,unknown>):Profile{
 const v={...empty};
 for(const k of Object.keys(empty) as (keyof Profile)[]){
  const value=row[k];
  if(k==="goals"){v.goals=Array.isArray(value)?value.filter(x=>typeof x==="string"):[];continue}
  if(k==="ai_consent"){v.ai_consent=value===true;continue}
  if(k==="completed_step"){v.completed_step=typeof value==="number"?Math.max(1,Math.min(5,value)):1;continue}
  if(k==="ai_consent_at"||k==="photo_path"){v[k]=typeof value==="string"?value:null;continue}
  if(typeof value==="string"||typeof value==="number") (v as unknown as Record<string,unknown>)[k]=String(value);
 }
 return v;
}
export default function Perfil(){
 const {client:db,user,status,identity,refreshProfile}=useWellnessAuth();
 const [profile,setProfile]=useState<Profile>(empty);
 const [step,setStep]=useState(1);
 const [overview,setOverview]=useState(true);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [note,setNote]=useState("");
 const avatar=identity.avatarUrl;
 const set=(k:keyof Profile,v:unknown)=>setProfile(p=>({...p,[k]:v}));
 useEffect(()=>{
   if(!db||status==="error"){setLoading(false);return}
   if(status==="loading"){setLoading(true);return}
   if(!user){setProfile(empty);setLoading(false);return}
   let active=true;
   setLoading(true);
   void Promise.resolve(db.from("wellness_profiles").select("*").eq("user_id",user.id).maybeSingle()).then(res=>{
     if(!active)return;
     if(!res.error&&res.data){const p=normalize(res.data as Record<string,unknown>);setProfile(p);setStep(p.completed_step)}
     if(res.error)setNote("No pudimos cargar tu perfil. Actualiza la página para intentarlo nuevamente.");
     setLoading(false);
   }).catch(()=>{if(active){setNote("No pudimos cargar tu perfil.");setLoading(false)}});
   return()=>{active=false};
 },[db,user,status]);
 async function save(target=step){
   if(!db||!user||busy)return false;
   const height=profile.height_cm.trim()?Number(profile.height_cm):null;
   const weight=profile.weight_kg.trim()?Number(profile.weight_kg):null;
   const sleep=profile.sleep_hours.trim()?Number(profile.sleep_hours):null;
   if((height!==null&&(height<50||height>260))||(weight!==null&&(weight<15||weight>350))||(sleep!==null&&(sleep<0||sleep>24))){
      setNote("Revisa los valores de altura, peso o sueño antes de guardar.");return false;
   }
   setBusy(true);setNote("");
   const consentTime=profile.ai_consent?(profile.ai_consent_at||new Date().toISOString()):null;
   const optional=(s:string)=>s.trim()||null;
   const payload={
    user_id:user.id,first_name:optional(profile.first_name),last_name:optional(profile.last_name),
    birth_date:profile.birth_date||null,sex_for_references:profile.sex_for_references||null,
    country:optional(profile.country),timezone:optional(profile.timezone),height_cm:height,weight_kg:weight,
    activity_level:profile.activity_level||null,conditions:optional(profile.conditions),medications:optional(profile.medications),
    allergies:optional(profile.allergies),history_notes:optional(profile.history_notes),sleep_hours:sleep,
    exercise_frequency:optional(profile.exercise_frequency),nutrition_pattern:optional(profile.nutrition_pattern),
    hydration:optional(profile.hydration),tobacco:optional(profile.tobacco),alcohol:optional(profile.alcohol),
    stress_level:profile.stress_level||null,goals:profile.goals,communication_preference:profile.communication_preference,
    ai_consent:profile.ai_consent,ai_consent_at:consentTime,photo_path:profile.photo_path,
    completed_step:target,updated_at:new Date().toISOString()
   };
   const {error}=await db.from("wellness_profiles").upsert(payload,{onConflict:"user_id"});
   setBusy(false);
   if(error){setNote("No fue posible guardar el perfil. Revisa la información e inténtalo de nuevo.");return false}
   setProfile(p=>({...p,ai_consent_at:consentTime,completed_step:target}));
   await refreshProfile();
   setNote(target===5?"Tu perfil se ha guardado. Puedes actualizarlo cuando quieras.":"Tus cambios se guardaron.");
   return true;
 }
 async function navigate(target:number){if(await save(target))setStep(target)}
 async function backToOverview(){if(await save(step))setOverview(true)}
 async function upload(file?:File){
  if(!file||!db||!user||busy)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2*1024*1024){setNote("Elige un archivo JPG, PNG o WebP de hasta 2 MB.");return}
  setBusy(true);setNote("");
  const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
  const path=user.id+"/"+crypto.randomUUID()+"."+ext;
  const {error}=await db.storage.from("wellness-avatars").upload(path,file,{contentType:file.type,upsert:false});
  if(error){setBusy(false);setNote("No fue posible subir la imagen. Inténtalo de nuevo.");return}
  const old=profile.photo_path;
  const {error:dbError}=await db.from("wellness_profiles").upsert({user_id:user.id,photo_path:path,completed_step:step},{onConflict:"user_id"});
  if(dbError){await db.storage.from("wellness-avatars").remove([path]);setNote("No se pudo guardar la fotografía.");setBusy(false);return}
  setProfile(p=>({...p,photo_path:path}));await refreshProfile();
  if(old&&old!==path)await db.storage.from("wellness-avatars").remove([old]);
  setNote("Fotografía actualizada.");setBusy(false);
 }
 async function removePhoto(){
  if(!db||!user||!profile.photo_path||busy)return;
  setBusy(true);setNote("");
  const old=profile.photo_path;
  const {error}=await db.from("wellness_profiles").update({photo_path:null}).eq("user_id",user.id);
  if(error){setNote("No fue posible eliminar la fotografía.");setBusy(false);return}
  await db.storage.from("wellness-avatars").remove([old]);
  setProfile(p=>({...p,photo_path:null}));await refreshProfile();setBusy(false);setNote("Fotografía eliminada.");
 }
 const sections=[
  {step:1,title:"Datos personales",desc:"Identidad, fotografía y referencias personales",symbol:"◉"},
  {step:2,title:"Medidas y actividad",desc:"Altura, peso y nivel de actividad",symbol:"◇"},
  {step:3,title:"Mi salud",desc:"Antecedentes y datos declarados por ti",symbol:"♡"},
  {step:4,title:"Mis hábitos",desc:"Sueño, alimentación y actividad habitual",symbol:"◎"},
  {step:5,title:"Objetivos y privacidad",desc:"Preferencias, objetivos y consentimiento",symbol:"✳"}
 ];
 const select=(key:keyof Profile,options:string[])=> <select style={inputStyle} value={String(profile[key]??"")} onChange={e=>set(key,e.target.value)}><option value="">Prefiero no indicar</option>{options.map(s=><option value={s} key={s}>{s==="low"?"Bajo":s==="moderate"?"Moderado":s==="high"?"Alto":s==="female"?"Femenino":s==="male"?"Masculino":s==="unspecified"?"No especificado":s}</option>)}</select>;
 const field=(name:string,key:keyof Profile,placeholder="")=><Field label={name}><input style={inputStyle} value={String(profile[key]??"")} placeholder={placeholder} maxLength={key==="nutrition_pattern"||key==="hydration"?300:100} onChange={e=>set(key,e.target.value)}/></Field>;
 const area=(name:string,key:keyof Profile)=><Field label={name}><textarea style={{...inputStyle,minHeight:83,resize:"vertical"}} value={String(profile[key]??"")} maxLength={2000} onChange={e=>set(key,e.target.value)}/></Field>;
 return <main className="well-shell" style={{maxWidth:980,paddingTop:45,paddingBottom:70}}>
  <span className="well-eyebrow">Mi cuenta · Perfil de bienestar</span>
  <h1 className="well-title" style={{fontSize:"clamp(30px,4vw,44px)",marginBottom:12}}>{overview?"Mi perfil": "Editar mi perfil"}</h1>
  <p className="well-subtitle" style={{marginTop:0}}>Administra tu información personal en un solo lugar. Puedes actualizar cada sección cuando lo necesites.</p>
  {!db?<div className="well-card" style={{padding:24}}>El servicio no está disponible en este momento.</div>:
   loading?<div className="well-card" style={{padding:24}}>Preparando tu perfil…</div>:
   !user?<div className="well-card" style={{padding:24}}>Para editar tu perfil necesitas <a className="well-link" href="/sprint-6-2/persistencia">iniciar sesión</a>.</div>:
   overview?<div style={{display:"grid",gap:18}}>
    <section className="well-card" style={{padding:"24px clamp(18px,4vw,32px)"}}>
     <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
      <div style={{width:78,height:78,borderRadius:"50%",background:"#EEE8FF",overflow:"hidden",display:"grid",placeItems:"center",color:"#5B40F5",fontWeight:800,fontSize:24}}>
       {avatar?<img alt="Fotografía de perfil" src={avatar} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span aria-hidden="true">{(profile.first_name[0]||"")+ (profile.last_name[0]||"")||"◉"}</span>}
      </div>
      <div style={{flex:1,minWidth:175}}>
       <strong style={{fontSize:22}}>{[profile.first_name,profile.last_name].filter(Boolean).join(" ")||"Mi cuenta"}</strong>
       <p style={{margin:"6px 0",fontSize:12,color:"var(--well-muted)"}}>Información privada de tu cuenta</p>
       <span style={{fontSize:12,color:"#6750AC",fontWeight:700}}>Última sección guardada: {profile.completed_step} de 5</span>
      </div>
      <button className="well-button-secondary" type="button" onClick={()=>{setStep(1);setOverview(false)}}>Cambiar fotografía</button>
     </div>
    </section>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(235px,1fr))",gap:13}}>
     {sections.map(item=><button key={item.step} type="button" onClick={()=>{setStep(item.step);setOverview(false)}} style={{textAlign:"left",cursor:"pointer",background:"#fff",border:"1px solid #E7E4EE",borderRadius:17,padding:20,minHeight:135,display:"grid",gap:9,color:"#211A33"}}>
      <span style={{width:35,height:35,borderRadius:11,background:"#EEE8FF",color:"#5B40F5",display:"grid",placeItems:"center",fontSize:20}} aria-hidden="true">{item.symbol}</span>
      <strong style={{fontSize:15}}>{item.title}</strong>
      <span style={{fontSize:12,lineHeight:1.5,color:"#777084"}}>{item.desc}</span>
      <span style={{color:"#5B40F5",fontWeight:700,fontSize:12}}>Editar sección →</span>
     </button>)}
    </div>
    <p style={{fontSize:12,color:"var(--well-muted)"}}>Tus antecedentes y autorizaciones son privados y no se muestran en el resumen.</p>
    {note&&<p role="status" aria-live="polite" className="well-info">{note}</p>}
   </div>:
   <div className="well-card" style={{padding:"28px clamp(18px,4vw,38px)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:17,flexWrap:"wrap"}}>
     <button className="well-button-secondary" type="button" onClick={()=>void backToOverview()} disabled={busy}>← Volver a mi perfil</button>
      <strong style={{fontSize:18}}>{steps[step-1]}</strong><span style={{fontSize:12,color:"var(--well-muted)"}}>Paso {step} de 5</span>
    </div>
    <div style={{display:"flex",gap:5,marginBottom:28}}>{steps.map((_,i)=><button key={i} type="button" disabled={busy} onClick={()=>void navigate(i+1)} aria-label={"Ir al paso "+(i+1)} style={{border:0,padding:0,flex:1,height:7,background:i<step?"#5B40F5":"#ECEAF2",borderRadius:20}} />)}</div>
    {step===1&&<div style={{display:"grid",gap:20}}>
      <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{width:98,height:98,borderRadius:28,background:"#F1F0FC",display:"grid",placeItems:"center",overflow:"hidden",border:"1px solid #E9E8F1"}}>
          {avatar?<img alt="Tu fotografía de perfil" src={avatar} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:38,color:"#5B40F5"}}>◉</span>}
        </div>
        <div style={{display:"grid",gap:9}}>
          <strong>Mi fotografía <span style={{fontWeight:400,color:"var(--well-muted)"}}>(opcional)</span></strong>
          <label className="well-button-secondary" style={{cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",width:"max-content"}}>Subir fotografía<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value=""}}/></label>
          {profile.photo_path&&<button type="button" onClick={()=>void removePhoto()} disabled={busy} style={{border:0,background:"none",color:"#5B40F5",padding:0,textAlign:"left",fontSize:12}}>Eliminar foto</button>}
          <span style={{fontSize:12,color:"var(--well-muted)"}}>JPG, PNG o WebP. Máximo 2 MB.</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:17}}>
        {field("Nombre","first_name","Tu nombre")}{field("Apellido","last_name","Tu apellido")}
        <Field label="Fecha de nacimiento"><input style={inputStyle} type="date" value={profile.birth_date} onChange={e=>set("birth_date",e.target.value)}/></Field>
        <Field label="Sexo para referencias de laboratorio">{select("sex_for_references",["female","male","unspecified"])}</Field>
        {field("País","country")}{field("Zona horaria","timezone","Ej. America/Caracas")}
      </div>
    </div>}
    {step===2&&<div style={{display:"grid",gap:18}}>
      <p style={{color:"var(--well-muted)",margin:0}}>Estas medidas aportan contexto a tus objetivos y pueden actualizarse más adelante.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
        <Field label="Altura (cm)"><input style={inputStyle} type="number" min={50} max={260} step=".1" value={profile.height_cm} onChange={e=>set("height_cm",e.target.value)}/></Field>
        <Field label="Peso (kg)"><input style={inputStyle} type="number" min={15} max={350} step=".1" value={profile.weight_kg} onChange={e=>set("weight_kg",e.target.value)}/></Field>
        <Field label="Nivel de actividad habitual">{select("activity_level",["low","moderate","high","unspecified"])}</Field>
      </div>
    </div>}
    {step===3&&<div style={{display:"grid",gap:16}}>
      <p style={{color:"var(--well-muted)",margin:"0 0 5px"}}>Puedes compartir antecedentes que consideres relevantes. Esta información es declarada por ti y no sustituye un registro médico.</p>
      {area("Condiciones de salud conocidas","conditions")}{area("Medicamentos que utilizas","medications")}
      {area("Alergias","allergies")}{area("Otros antecedentes que desees compartir","history_notes")}
    </div>}
    {step===4&&<div style={{display:"grid",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:16}}>
        <Field label="Horas de sueño habituales"><input style={inputStyle} type="number" min={0} max={24} step=".5" value={profile.sleep_hours} onChange={e=>set("sleep_hours",e.target.value)}/></Field>
        {field("Frecuencia de ejercicio","exercise_frequency","Ej. 3 días por semana")}
        {field("Alimentación habitual","nutrition_pattern")}{field("Hidratación","hydration")}
        {field("Tabaco","tobacco")}{field("Alcohol","alcohol")}
        <Field label="Estrés percibido">{select("stress_level",["low","moderate","high","unspecified"])}</Field>
      </div>
    </div>}
    {step===5&&<div style={{display:"grid",gap:20}}>
      <div><strong>Mis objetivos de bienestar</strong><p style={{fontSize:13,color:"var(--well-muted)"}}>Selecciona los que sean importantes para ti.</p>
        <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>{goals.map(g=><button key={g} type="button" onClick={()=>set("goals",profile.goals.includes(g)?profile.goals.filter(x=>x!==g):[...profile.goals,g])} style={{border:profile.goals.includes(g)?"1px solid #5B40F5":"1px solid #E0DFE8",borderRadius:12,padding:"11px 13px",background:profile.goals.includes(g)?"#EBEAFE":"white",color:profile.goals.includes(g)?"#5B40F5":"#161620",fontWeight:600,fontSize:12}}>{g}</button>)}</div>
      </div>
      <Field label="Cómo prefieres recibir las explicaciones">{select("communication_preference",["simple","balanced","detailed"])}</Field>
      <div style={{background:"#F7F7FB",padding:20,borderRadius:15,border:"1px solid #EAE8F1"}}>
        <label style={{display:"flex",gap:12,alignItems:"flex-start",cursor:"pointer"}}>
        <input type="checkbox" checked={profile.ai_consent} onChange={e=>setProfile(p=>({...p,ai_consent:e.target.checked,ai_consent_at:e.target.checked?p.ai_consent_at:null}))} style={{marginTop:3,accentColor:"#5B40F5"}}/>
        <span><strong style={{fontSize:14}}>Autorizo la personalización mediante WELLNESS Intelligence</strong><span style={{display:"block",fontSize:13,lineHeight:1.6,color:"var(--well-muted)",marginTop:5}}>Permito que el asistente utilice mis respuestas de perfil para contextualizar sus explicaciones cuando la función esté disponible. Puedo retirar esta autorización en cualquier momento.</span></span></label>
      </div>
    </div>}
    {note&&<p role="status" aria-live="polite" style={{background:"#EFF8DB",padding:14,borderRadius:12,color:"#161620",fontSize:13}}>{note}</p>}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"space-between",marginTop:28}}>
      <button className="well-button-secondary" type="button" disabled={busy||step===1} onClick={()=>void navigate(step-1)}>Anterior</button>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
       <button className="well-button-secondary" type="button" disabled={busy} onClick={()=>void save()}>{busy?"Guardando…":"Guardar y continuar después"}</button>
       {step<5?<button className="well-button" type="button" disabled={busy} onClick={()=>void navigate(step+1)}>Siguiente →</button>:
       <button className="well-button" type="button" disabled={busy} onClick={()=>void save(5)}>Guardar mi perfil</button>}
      </div>
    </div>
   </div>}
 </main>;
}
