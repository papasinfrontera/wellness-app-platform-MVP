"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import catalogData from "./catalog-reference.json";
import "./analisis.css";
type Item={id:number;name:string;name_en?:string;aliases?:string[];code?:string};
type Result={code:string;value:number;unit:string};
const catalog=catalogData as Item[];
const groups=["Sangre","Salud cerebral","Salud digestiva","Corazón y circulación","Hormonas","Inflamación","Riñones","Salud metabólica","Vitaminas y nutrientes","Estrés y energía","Exposición y toxinas"];
const patterns=[/hemoglobin|hematocrit|blood cell|platelet|corpuscular|basophil|eosinophil|lymphocyte|monocyte|neutrophil|red cell|reticulocyte|rdw|mcv|mch|rbc|wbc/i,/vitamin b12|folate|homocysteine|thyroid/i,/albumin|globulin|bilirubin|alkaline phosphatase|aminotransferase|total protein|fib-4|ggt/i,/cholesterol|apolipoprotein|atherogenic|lipoprotein|triglyceride|ldl|hdl|homocysteine/i,/testosterone|estradiol|cortisol|dhea|thyroid|tsh|free t3|free t4|prolactin|progesterone|shbg/i,/crp|inflammation|immune|myeloperoxidase|mpo/i,/creatinine|blood urea|bun\/|uric acid|potassium|sodium|chloride|osmolality|cystatin|egfr/i,/glucose|a1c|insulin|homa|fructosamine|triglyceride|atherogenic/i,/vitamin|calcium|magnesium|iron|ferritin|folate|potassium|phosphorus|zinc|selenium|iodine/i,/cortisol|dhea|thyroid|glucose|testosterone|creatine kinase/i,/lead|mercury|cadmium|arsenic|toxin/i];
const clean=(s:string)=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const filters=["Todos","Con resultado","Óptimos","Suficientes","Fuera de rango","Sin resultados"];
export default function Analysis(){
 const [first,setFirst]=useState(""),[auth,setAuth]=useState<"loading"|"denied"|"ready"|"error">("loading"),[results,setResults]=useState<Result[]>([]);
 const [search,setSearch]=useState(""),[group,setGroup]=useState(-1),[filter,setFilter]=useState(0),[reverse,setReverse]=useState(false),[page,setPage]=useState(1),[role,setRole]=useState("Usuario");
 useEffect(()=>{let active=true;void(async()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){setAuth("error");return}
  const db=createClient(url,key),{data:{user},error}=await db.auth.getUser();
  if(!active)return;
  if(error||!user){setAuth("denied");return}
  const [p,o]=await Promise.all([db.from("wellness_profiles").select("first_name").eq("user_id",user.id).maybeSingle(),db.from("observations").select("value,unit,observed_at,indicators(code,name_es)").eq("user_id",user.id).order("observed_at",{ascending:false}).limit(3000)]);
  if(!active)return;
  if(p.error||o.error){setAuth("error");return}
  setFirst(p.data?.first_name||"");
  const found:Result[]=(o.data||[]).flatMap((v):Result[]=>{
   const raw=v as unknown as {value:number;unit:string;indicators:{code?:string;name_es?:string}|{code?:string;name_es?:string}[]|null};
   const marker=Array.isArray(raw.indicators)?raw.indicators[0]:raw.indicators;
   return marker?.code&&typeof raw.value==="number"?[{code:marker.code,value:raw.value,unit:raw.unit||""}]:[];
  });
  setResults(found);setAuth("ready");
 })().catch(()=>{if(active)setAuth("error")});return()=>{active=false}},[]);
 const resultMap=useMemo(()=>{const m=new Map<string,Result>();for(const r of results)if(!m.has(r.code))m.set(r.code,r);return m},[results]);
 const measured=useMemo(()=>catalog.filter(x=>resultMap.has("REF-"+String(x.id).padStart(3,"0"))).length,[resultMap]);
 const rows=useMemo(()=>catalog.filter(x=>(group===-1||patterns[group].test(x.name_en||x.name))&&[x.name,x.name_en||"",...(x.aliases||[])].some(v=>clean(v).includes(clean(search)))).filter(x=>filter===1?resultMap.has("REF-"+String(x.id).padStart(3,"0")):filter===5?!resultMap.has("REF-"+String(x.id).padStart(3,"0")):filter===0).sort((a,b)=>reverse?b.name.localeCompare(a.name,"es"):a.name.localeCompare(b.name,"es")),[group,search,filter,resultMap,reverse]);
 const pages=Math.max(1,Math.ceil(rows.length/15)),current=Math.min(page,pages);
 const counts=[catalog.length,measured,null,null,null,catalog.length-measured];
 const tiles=[["◈",catalog.length,"Indicadores","Catálogo de referencia"],["◉",measured,"Con resultado","Datos de tu cuenta"],["✓","—","Óptimos","Pendiente de validación"],["●","—","Suficientes","Pendiente de validación"],["⚠","—","Fuera de rango","Pendiente de validación"],["—",catalog.length-measured,"Sin resultados","Sin mediciones"]];
 return <main className="wa-page"><div className="wa-hero"><span className="wa-eyebrow">MIS ANÁLISIS DE SANGRE</span><h1 className="wa-title">{first?first+", tus resultados cuentan una historia.":"Tus resultados cuentan una historia."}</h1><p className="wa-subtitle">Descubre cómo evolucionan tus indicadores.</p></div>
 {auth==="denied"&&<div className="wa-auth-notice"><div><h2>Catálogo disponible · resultados privados</h2><p>Explora los 128 indicadores. Inicia sesión para consultar tus mediciones personales.</p></div><a href="/sprint-6-2/persistencia" className="wb-action">Iniciar sesión</a></div>}{auth==="error"&&<div className="wb-state" role="status">Los 128 indicadores están disponibles. La consulta de resultados personales no está disponible en este momento.</div>}<>
 <div className="wa-metrics"><div className="wa-metric wa-lime"><div><span className="wa-metric-label">♧ Edad PhenoAge</span><div className="wa-metric-number" style={{marginTop:12}}>—</div><span className="wa-metric-desc">Pendiente de cálculo validado</span></div><div className="wa-metric-secondary"><span className="wa-metric-desc">Edad cronológica</span><br/><b>Por calcular</b><br/><span className="wa-metric-desc">Diferencia</span><br/><b>—</b></div></div>{tiles.map(t=><article className="wa-metric" key={String(t[2])}><span className="wa-metric-symbol">{t[0]}</span><strong className="wa-metric-number">{auth==="loading"?"…":t[1]}</strong><span className="wa-metric-label">{t[2]}</span><span className="wa-metric-desc">{t[3]}</span></article>)}</div>
 <div className="wa-catalog-shell"><aside className="wa-categories"><h2>◈ &nbsp; Categorías</h2><div className="wa-category-list"><button className={"wa-cat"+(group===-1?" on":"")} onClick={()=>{setGroup(-1);setPage(1)}}><span className="wa-cat-label">◈ Todas las categorías</span><span className="wa-cat-num">{catalog.length}</span></button>{groups.map((g,i)=><button key={g} className={"wa-cat"+(group===i?" on":"")} onClick={()=>{setGroup(i);setPage(1)}}><span className="wa-cat-label"><span className="wa-cat-icon">◇</span>{g}</span><span className="wa-cat-num">{catalog.filter(x=>patterns[i].test(x.name_en||x.name)).length}</span></button>)}</div></aside>
 <section className="wa-explorer"><div className="wa-explore-top"><h2>☷ &nbsp; Explorar mis indicadores</h2><div className="wa-mode-switch"><button className={role==="Usuario"?"on":""} onClick={()=>setRole("Usuario")}>Usuario</button><button className={role==="Médico"?"on":""} onClick={()=>setRole("Médico")}>Médico</button></div></div>
 <input aria-label="Buscar indicadores" className="wa-search" placeholder="⌕  Buscar: glucosa, glicemia, HbA1c, ApoB…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
 <div className="wa-pills">{filters.map((f,i)=><button key={f} className={"wa-pill"+(filter===i?" on":"")} disabled={i>=2&&i<=4} title={i>=2&&i<=4?"Clasificación pendiente de validación científica":undefined} onClick={()=>{setFilter(i);setPage(1)}}>{f} ({counts[i]===null?"—":counts[i]})</button>)}</div>
 <div className="wa-tabletop"><span className="wa-caption">{rows.length?((current-1)*15+1)+"–"+Math.min(rows.length,current*15)+" de "+rows.length:"0"} indicadores</span><select className="wa-sort" aria-label="Ordenar" value={reverse?"za":"az"} onChange={e=>{setReverse(e.target.value==="za");setPage(1)}}><option value="az">Orden: A–Z</option><option value="za">Orden: Z–A</option></select></div>
 <div className="wa-table-scroll"><div role="table" className="wa-results"><div role="row" className="wa-result-head"><span>Indicador</span><span>Resultado</span><span>Estado</span><span>Posición actual</span><span/></div>{rows.slice((current-1)*15,current*15).map(m=>{const x=resultMap.get("REF-"+String(m.id).padStart(3,"0"));return <a key={m.id} className="wa-result-row" style={{textDecoration:"none"}} href={"/mi-analisis/"+m.id}><span className="wa-result-name">{m.name}</span><span>{x?<><strong>{x.value}</strong><span className="wa-result-unit">{x.unit}</span></>:"—"}</span><span className="wa-result-status">{x?"En revisión":"Sin resultados"}</span><span className="wa-range-empty">Sin escala verificada</span><span className="wa-result-chevron">›</span></a>})}{rows.length===0&&<div className="wa-result-empty">No hay indicadores que coincidan con el filtro.</div>}</div></div>
 <div className="wa-paginator"><button disabled={current<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹ Anterior</button><span>Página {current} de {pages}</span><button disabled={current>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Siguiente ›</button></div>
 </section></div><p className="wa-disclaimer">{role==="Médico"?"La modalidad médica de Doctor Connect todavía no permite acceso a otros pacientes. ":""}Los nombres provienen del catálogo aprobado de la demo; los resultados se obtienen exclusivamente de la cuenta autenticada. Sin una importación validada, se mostrarán como “Sin resultados”. No se inventan rangos ni calificaciones clínicas.</p></>
 </main>
}
