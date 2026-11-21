"use client";
import { useState } from "react";
import styles from "./mobile.module.css";

type Tab = "inicio" | "diario" | "fitness" | "biologia";
type Drawer = "acciones" | "menu" | "doctor" | "estado" | "registro" | "indicadores" | null;
type HabitKey = "agua" | "cafe" | "movimiento" | "descanso";
const entries: {id:HabitKey; label:string; detail:string; symbol:string}[] = [
  {id:"agua",label:"Hidratación",detail:"Registrar consumo",symbol:"💧"},
  {id:"cafe",label:"Cafeína",detail:"Registrar consumo",symbol:"☕"},
  {id:"movimiento",label:"Actividad",detail:"Registrar movimiento",symbol:"🏃"},
  {id:"descanso",label:"Sueño",detail:"Registrar descanso",symbol:"🌙"}
];
const tabs: {id:Tab; label:string; symbol:string}[] = [
  {id:"inicio",label:"Inicio",symbol:"⌂"},
  {id:"diario",label:"Diario",symbol:"▤"},
  {id:"fitness",label:"Fitness",symbol:"⚒"},
  {id:"biologia",label:"Biología",symbol:"◫"}
];
export default function MobilePreview(){
 const [tab,setTab]=useState<Tab>("inicio");
 const [drawer,setDrawer]=useState<Drawer>(null);
 const [state,setState]=useState("Activo");
 const [habits,setHabits]=useState<Record<HabitKey,boolean>>({agua:false,cafe:false,movimiento:false,descanso:false});
 const [quantity,setQuantity]=useState("250");
 const [units,setUnits]=useState("ml");
 const [chosen,setChosen]=useState<HabitKey>("agua");
 const [notice,setNotice]=useState("");
 const [expanded,setExpanded]=useState("Sueño");
 const [series,setSeries]=useState<boolean[]>([false,false,false]);
 function go(next:Tab){setTab(next);setDrawer(null);setNotice("");}
 function showRegister(k:HabitKey){setChosen(k);setQuantity(k==="agua"?"250":k==="cafe"?"100":"1");setUnits(k==="agua"?"ml":k==="cafe"?"mg":"registro");setDrawer("registro");}
 function finishRegister(){setHabits(h=>({...h,[chosen]:true}));setDrawer(null);setNotice("Registro de demostración guardado solo en esta sesión.");}
 function menuItem(label:string,action:()=>void){return <button type="button" className={styles.menuOption} onClick={action}><span>{label}</span><span aria-hidden="true">›</span></button>;}
 return <div className={styles.outer}>
  <div className={styles.device}>
   <header className={styles.status}><span>9:41</span><span className={styles.island}/><span>▂▅▇ ᴡɪғɪ ▰</span></header>
   <main className={styles.main} key={tab}>
    {tab==="inicio"&&<>
      <div className={styles.headerline}><h1>Hoy, 12 de marzo <span className={styles.chev}>⌄</span></h1><button type="button" className={styles.avatar} onClick={()=>setDrawer("menu")}>RF</button></div>
      <div className={styles.chips}><button type="button" className={styles.chip} onClick={()=>setDrawer("estado")}><b className={styles.greenbubble}>♧</b><span>{state}<small>Hasta nuevo aviso</small></span><span>⌄</span></button><div className={styles.chip}><b>☀️</b><span>Clima<small>No conectado</small></span></div></div>
      <section className={styles.scores}>
       {([{name:"Esfuerzo",stroke:"#F9AA37",icon:"◷"},{name:"Recuperación",stroke:"#51C62C",icon:"♡"},{name:"Sueño",stroke:"#8A7AE8",icon:"☾"}] as const).map(s=><button type="button" className={styles.score} key={s.name} onClick={()=>setDrawer("indicadores")}><span className={styles.ring} style={{borderColor:s.stroke}}><span>—</span></span><strong>{s.name}</strong></button>)}
      </section>
      <section className={styles.paper}><strong>Buenos días ☀️</strong><p>Conecta tus dispositivos para conocer tu esfuerzo, recuperación y sueño con información verificada.</p></section>
      <button type="button" className={styles.doctorStrip} onClick={()=>setDrawer("doctor")}><span>♧</span><span><strong>Doctor Connect</strong><small>Comparte con profesionales autorizados</small></span><b>›</b></button>
      <h2>Estrés y energía</h2><section className={styles.paper}><div className={styles.line}><b>🟢 Estrés de hoy</b><span>›</span></div><p>No hay mediciones conectadas todavía.</p><div className={styles.placeholderBars}><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></section>
      <h2>Nutrición</h2><button className={styles.paperButton} type="button" onClick={()=>go("diario")}>🥗 Mi nutrición de hoy <span>›</span></button>
    </>}
    {tab==="diario"&&<>
     <div className={styles.headerline}><div><h1>Diario</h1><span className={styles.subtitle}>Noviembre de 2026</span></div><button className={styles.dotMenu} type="button" onClick={()=>setDrawer("menu")}>•••</button></div>
     <div className={styles.week}>{["L","M","M","J","V","S","D"].map((d,i)=><div key={i}><small>{d}</small><strong>{16+i}</strong><span className={i===5?styles.today:styles.emptyDay}>{i===5?"•":"○"}</span></div>)}</div>
     <h2>Mis registros</h2><p className={styles.hint}>Tus hábitos, un día a la vez.</p>
     <div className={styles.sectionLabel}>Durante el día</div>
     {entries.map(e=><button key={e.id} type="button" className={styles.entry} onClick={()=>showRegister(e.id)}><span>{e.symbol} {e.label}</span><span className={habits[e.id]?styles.positive:styles.muted}>{habits[e.id]?"Registrado":"Pendiente"}　›</span></button>)}
     <div className={styles.sectionLabel}>Análisis</div>
     <section className={styles.paper}><b>Relación entre hábitos y bienestar</b><p>Los análisis aparecerán cuando existan suficientes registros longitudinales.</p></section>
    </>}
    {tab==="fitness"&&<>
     <div className={styles.headerline}><div><span className={styles.brand}>Viiddaa<span>+</span></span><h1>Fitness</h1><p className={styles.subtitle}>Entrenamiento, actividad y progreso.</p></div><button className={styles.dotMenu} type="button" onClick={()=>setDrawer("menu")}>•••</button></div>
     <section className={styles.sessionBanner}><span>♧　Sesión de demostración</span><span>Sin iniciar</span></section>
     <section className={styles.paper}><div className={styles.line}><div><b>Entrenamiento de fuerza</b><p className={styles.hint}>Ejemplo de interacción; no es una sesión real.</p></div><span>02:28*</span></div><h3>Sentadilla trasera</h3>{series.map((done,i)=><button className={styles.setRow} type="button" onClick={()=>setSeries(a=>a.map((v,j)=>i===j?!v:v))} key={i}><span className={done?styles.doneCircle:styles.numberCircle}>{done?"✓":i+1}</span><span>Carga —</span><span>Repeticiones —</span><b>{done?"✓":"▷"}</b></button>)}<button className={styles.softButton} type="button" onClick={()=>setSeries(a=>[...a,false])}>＋ Agregar serie</button></section>
     <button className={styles.paperButton} type="button" onClick={()=>setNotice("La progresión se activará al registrar entrenamientos reales.")}>↗ Progresión　<span>›</span></button>
     <button className={styles.paperButton} type="button" onClick={()=>setNotice("Biblioteca de ejercicios: pendiente de implementación.")}>▧ Biblioteca de ejercicios <span>›</span></button>
    </>}
    {tab==="biologia"&&<>
     <div className={styles.headerline}><div><span className={styles.brand}>Viiddaa<span>+</span></span><h1>Biología</h1><p className={styles.subtitle}>Tu salud a largo plazo, en una mirada.</p></div><button className={styles.dotMenu} type="button" onClick={()=>setDrawer("menu")}>•••</button></div>
     <section className={styles.agePanel}><span className={styles.panelTitle}>Edad biológica</span><span className={styles.hint}>PhenoAge · cálculo pendiente de validación</span><div className={styles.ageArch}><div>—<small>años</small></div></div><div className={styles.ageStatus}>Aún no hay resultados validados</div><div className={styles.ageStats}><span>Edad cronológica<br/><b>—</b></span><span>Diferencia<br/><b>—</b></span></div></section>
     {["Sueño","Actividad","Recuperación","Hábitos","Análisis de sangre"].map((s,i)=><div className={styles.bioGroup} key={s}><button type="button" onClick={()=>setExpanded(a=>a===s?"":s)}><span className={styles.categoryIcon}>{["☾","♧","♡","♧","♙"][i]}</span><span><strong>{s}</strong><small>Consulta el histórico de indicadores</small></span><span>{expanded===s?"⌄":"›"}</span></button>{expanded===s&&<p>No se mostrará una valoración hasta que existan datos suficientes y criterios validados.</p>}</div>)}
     <button type="button" className={styles.doctorStrip} onClick={()=>setDrawer("doctor")}><span>♧</span><span><strong>Doctor Connect</strong><small>Comparte resultados con autorización</small></span><b>›</b></button>
    </>}
   </main>
   {notice&&<div role="status" className={styles.toast} onClick={()=>setNotice("")}>{notice}</div>}
   <div className={styles.assistant}><span className={styles.orb}>●●</span><span>Pregunta a Viiddaa+</span></div>
   <nav className={styles.bottom} aria-label="Navegación principal">
    {tabs.slice(0,2).map(t=><button key={t.id} className={tab===t.id?styles.active:""} onClick={()=>go(t.id)} type="button"><span>{t.symbol}</span><small>{t.label}</small></button>)}
    <button type="button" className={styles.plus} aria-label="Abrir menú de acciones" onClick={()=>setDrawer("acciones")}>+</button>
    {tabs.slice(2).map(t=><button key={t.id} className={tab===t.id?styles.active:""} onClick={()=>go(t.id)} type="button"><span>{t.symbol}</span><small>{t.label}</small></button>)}
   </nav>
   {drawer&&<div className={styles.overlay} role="presentation" onClick={()=>setDrawer(null)}><section role="dialog" aria-modal="true" aria-label={drawer==="acciones"?"Menú de acciones":drawer==="doctor"?"Doctor Connect":"Opciones"} className={styles.sheet} onClick={e=>e.stopPropagation()}>
    <div className={styles.sheetHead}><strong>{drawer==="acciones"?"Acciones rápidas":drawer==="menu"?"Menú":drawer==="doctor"?"Doctor Connect":drawer==="estado"?"Estado de actividad":drawer==="registro"?"Nuevo registro":"Indicadores"}</strong><button type="button" aria-label="Cerrar" onClick={()=>setDrawer(null)}>✕</button></div>
    {drawer==="acciones"&&<>{menuItem("♧  Doctor Connect",()=>setDrawer("doctor"))}{menuItem("💧  Registrar agua",()=>showRegister("agua"))}{menuItem("☕  Registrar cafeína",()=>showRegister("cafe"))}{menuItem("▤  Ir al Diario",()=>go("diario"))}{menuItem("⚒  Ir a Fitness",()=>go("fitness"))}{menuItem("◫  Ir a Biología",()=>go("biologia"))}{menuItem("☰  Más opciones",()=>setDrawer("menu"))}</>}
    {drawer==="menu"&&<>{menuItem("♧  Doctor Connect",()=>setDrawer("doctor"))}{menuItem("⌂  Inicio",()=>go("inicio"))}{menuItem("▤  Diario",()=>go("diario"))}{menuItem("⚒  Fitness",()=>go("fitness"))}{menuItem("◫  Biología",()=>go("biologia"))}{menuItem("⚙  Integraciones y perfil",()=>setNotice("Se implementará en un sprint posterior."))}</>}
    {drawer==="doctor"&&<><p className={styles.hint}>Comparte tus datos de bienestar con profesionales de confianza.</p><section className={styles.paper}><strong>Profesionales conectados</strong><p>No hay profesionales verificados asociados con esta vista previa.</p></section><h3>Permisos de acceso</h3>{["Análisis de sangre","Dispositivos conectados","Hábitos","Edad biológica"].map(p=><div key={p} className={styles.permission}><span>{p}</span><span className={styles.muted}>Sin conceder</span></div>)}<button className={styles.primaryButton} type="button" onClick={()=>setNotice("Invitaciones disponibles en Sprint Doctor Connect.")}>Invitar profesional</button><p className={styles.hint}>No se comparten datos ni se crean permisos desde esta demostración.</p></>}
    {drawer==="estado"&&["Activo","Enfermo","Lesionado","En descanso"].map(s=>menuItem(s,()=>{setState(s);setDrawer(null)}))}
    {drawer==="registro"&&<><p>{entries.find(e=>e.id===chosen)?.label}</p><label className={styles.field}>Cantidad<input type="number" min="0" value={quantity} onChange={e=>setQuantity(e.target.value)}/><span>{units}</span></label><button type="button" disabled={!(Number(quantity)>0)} className={styles.primaryButton} onClick={finishRegister}>Registrar en la demostración</button><p className={styles.hint}>Registro local temporal. No modifica ningún historial real.</p></>}
    {drawer==="indicadores"&&<><p className={styles.hint}>Esfuerzo, recuperación y sueño requieren una fuente conectada y cálculos validados.</p>{menuItem("Ver mis indicadores",()=>go("biologia"))}</>}
   </section></div>}
  </div>
  <div className={styles.footnote}>Viiddaa+ · Sprint 1 · Vista previa Mobile First. Valores de ejemplo solo en Fitness; sin datos clínicos inventados ni conexión a producción.</div>
 </div>;
