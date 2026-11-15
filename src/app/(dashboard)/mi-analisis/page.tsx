"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import catalogData from "./catalog-reference.json";
import {ANALYSIS_CATEGORIES,categoryForId} from "@/lib/indicator-categories";
import "./analisis.css";
type Item={id:number;name:string;name_en?:string;aliases?:string[];code?:string};
type Result={code:string;value:number;unit:string;status:string};
const catalog=catalogData as Item[];
const groups=[...ANALYSIS_CATEGORIES];
const clean=(s:string)=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const filters=["Todos","Con resultado","Óptimo","Suficiente","Fuera de rango","Sin resultado"];
const categoryFor=(item:Item):number=>categoryForId(item.id)??-1;
const categoryCounts=groups.map((_,i)=>catalog.filter(m=>categoryFor(m)===i).length);
const resultLabel=(value:number)=>new Intl.NumberFormat("es-ES",{maximumFractionDigits:6}).format(value);

export default function Analysis(){
 const [first,setFirst]=useState(""),[auth,setAuth]=useState<"loading"|"denied"|"ready"|"error">("loading"),[results,setResults]=useState<Result[]>([]);
 const [search,setSearch]=useState(""),[group,setGroup]=useState(-1),[filter,setFilter]=useState(0),[reverse,setReverse]=useState(false),[page,setPage]=useState(1),[role,setRole]=useState("Usuario");
 useEffect(()=>{let active=true;void(async()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){setAuth("error");return}
  const db=createClient(url,key),{data:{user},error}=await db.auth.getUser();
  if(!active)return;
  if(error||!user){setAuth("denied");return}
  const [p,o]=await Promise.all([db.from("wellness_profiles").select("first_name").eq("user_id",user.id).maybeSingle(),db.from("observations").select("value,unit,status,observed_at,indicators(code,name_es)").eq("user_id",user.id).order("observed_at",{ascending:false}).limit(3000)]);
  if(!active)return;
  if(p.error||o.error){setAuth("error");return}
  setFirst(p.data?.first_name||"");
  const found:Result[]=(o.data||[]).flatMap((v):Result[]=>{
   const raw=v as unknown as {value:number;unit:string;status:string;indicators:{code?:string;name_es?:string}|{code?:string;name_es?:string}[]|null};
   const marker=Array.isArray(raw.indicators)?raw.indicators[0]:raw.indicators;
   return marker?.code&&typeof raw.value==="number"?[{code:marker.code,value:raw.value,unit:raw.unit||"",status:raw.status||"pending_review"}]:[];
  });
  setResults(found);setAuth("ready");
 })().catch(()=>{if(active)setAuth("error")});return()=>{active=false}},[]);
 const resultMap=useMemo(()=>{const m=new Map<string,Result>();for(const r of results)if(!m.has(r.code))m.set(r.code,r);return m},[results]);
 const measured=useMemo(()=>catalog.filter(x=>resultMap.has("REF-"+String(x.id).padStart(3,"0"))).length,[resultMap]);
 const rows=useMemo(()=>catalog.filter(x=>(group===-1||categoryFor(x)===group)&&[x.name,x.name_en||"",...(x.aliases||[])].some(v=>clean(v).includes(clean(search)))).filter(x=>filter===1?auth==="ready"&&resultMap.has("REF-"+String(x.id).padStart(3,"0")):filter===5?auth==="ready"&&!resultMap.has("REF-"+String(x.id).padStart(3,"0")):filter===0).sort((a,b)=>reverse?b.name.localeCompare(a.name,"es"):a.name.localeCompare(b.name,"es")),[group,search,filter,resultMap,reverse]);
 const pages=Math.max(1,Math.ceil(rows.length/15)),current=Math.min(page,pages);
 const counts=[catalog.length,auth==="ready"?measured:null,null,null,null,auth==="ready"?catalog.length-measured:null];
 const tiles=[["◈",catalog.length,"Indicadores","Catálogo de referencia"],["◉",auth==="ready"?measured:"—","Con resultado","Datos de tu cuenta"],["✓","—","Óptimos","Pendiente de validación"],["●","—","Suficientes","Pendiente de validación"],["⚠","—","Fuera de rango","Pendiente de validación"],["—",auth==="ready"?catalog.length-measured:"—","Sin resultado","Sin mediciones"]];
 return <main className="wa-page"><div className="wa-hero"><span className="wa-eyebrow">MIS ANÁLISIS DE SANGRE</span><h1 className="wa-title">{first?first+", tus resultados cuentan una historia.":"Tus resultados cuentan una historia."}</h1><p className="wa-subtitle">Descubre cómo evolucionan tus indicadores.</p><a href="/mi-analisis/importar-pdf" style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:12,padding:"10px 15px",background:"#5B40F5",color:"white",borderRadius:10,fontSize:12,fontWeight:800,textDecoration:"none"}}>↑ Importar análisis desde PDF · piloto</a></div>
 {auth==="denied"&&<div className="wa-auth-notice" role="status"><div><h2>Catálogo disponible · resultados privados</h2><p>Los resultados no desaparecieron: esta dirección de revisión necesita su propia sesión. Inicia sesión aquí para consultar las mediciones asociadas a tu cuenta.</p></div><a href="/sprint-6-2/persistencia" className="wb-action">Iniciar sesión</a></div>}{auth==="error"&&<div className="wb-state" role="status">Los 128 indicadores están disponibles. La consulta de resultados personales no está disponible en este momento.</div>}<>
 <div className="wa-metrics"><div className="wa-metric wa-lime"><div><span className="wa-metric-label">♧ Edad PhenoAge</span><div className="wa-metric-number" style={{marginTop:12}}>—</div><span className="wa-metric-desc">Pendiente de cálculo validado</span></div><div className="wa-metric-secondary"><span className="wa-metric-desc">Edad cronológica</span><br/><b>Por calcular</b><br/><span className="wa-metric-desc">Diferencia</span><br/><b>—</b></div></div>{tiles.map(t=><article className="wa-metric" key={String(t[2])}><span className="wa-metric-symbol">{t[0]}</span><strong className="wa-metric-number">{auth==="loading"?"…":t[1]}</strong><span className="wa-metric-label">{t[2]}</span><span className="wa-metric-desc">{t[3]}</span></article>)}</div>
 <div className="wa-catalog-shell"><aside className="wa-categories"><h2>◈ &nbsp; Categorías</h2><div className="wa-category-list"><button className={"wa-cat"+(group===-1?" on":"")} onClick={()=>{setGroup(-1);setPage(1)}}><span className="wa-cat-label">◈ Todas las categorías</span><span className="wa-cat-num">{catalog.length}</span></button>{groups.map((g,i)=><button key={g} className={"wa-cat"+(group===i?" on":"")} onClick={()=>{setGroup(i);setPage(1)}}><span className="wa-cat-label"><span className="wa-cat-icon">◇</span>{g}</span><span className="wa-cat-num">{categoryCounts[i]}</span></button>)}</div></aside>
 <section className="wa-explorer"><div className="wa-explore-top"><h2>☷ &nbsp; Explorar mis indicadores</h2><div className="wa-mode-switch"><button className={role==="Usuario"?"on":""} onClick={()=>setRole("Usuario")}>Usuario</button><button className={role==="Médico"?"on":""} onClick={()=>setRole("Médico")}>Médico</button></div></div>
 <input aria-label="Buscar indicadores" className="wa-search" placeholder="⌕  Buscar: glucosa, glicemia, HbA1c, ApoB…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
 <div className="wa-pills">{filters.map((f,i)=><button key={f} className={"wa-pill"+(filter===i?" on":"")} disabled={(i>=2&&i<=4)||((i===1||i===5)&&auth!=="ready")} title={i>=2&&i<=4?"Requiere reglas científicas aprobadas":auth!=="ready"&&[1,5].includes(i)?"Inicia sesión para consultar tus resultados":undefined} onClick={()=>{setFilter(i);setPage(1)}}>{f} ({counts[i]===null?"—":counts[i]})</button>)}</div>
 <div className="wa-tabletop"><span className="wa-caption">{rows.length?((current-1)*15+1)+"–"+Math.min(rows.length,current*15)+" de "+rows.length:"0"} indicadores</span><select className="wa-sort" aria-label="Ordenar" value={reverse?"za":"az"} onChange={e=>{setReverse(e.target.value==="za");setPage(1)}}><option value="az">Orden: A–Z</option><option value="za">Orden: Z–A</option></select></div>
 <div className="wa-table-scroll"><div role="table" className="wa-results">
 <div role="row" className="wa-result-head"><span>Indicador</span><span>Resultado</span><span>Unidad</span><span>Estado</span><span>Categoría</span><span className="wa-sr-only">Ver detalle</span></div>
 {rows.slice((current-1)*15,current*15).map(m=>{
 const x=resultMap.get("REF-"+String(m.id).padStart(3,"0"));
 const category=categoryFor(m);
 return <a key={m.id} className="wa-result-row" style={{textDecoration:"none"}} href={"/mi-analisis/"+m.id} aria-label={"Abrir detalle de "+m.name}>
 <span className="wa-result-name">{m.name}</span>
 <span className="wa-result-value">{x?resultLabel(x.value):"—"}</span>
 <span className="wa-result-unit">{x?(x.unit||"—"):"—"}</span>
 <span><span className={"wa-result-status"+(x?.status==="approved"?" wa-result-status-confirmed":"")}>{x?(x.status==="approved"?"Confirmado · sin evaluar":"En revisión"):"Sin resultados"}</span></span>
 <span className="wa-result-category">{category>=0?groups[category]:"Pendiente de categoría"}</span>
 <span className="wa-result-chevron" aria-hidden="true">›</span>
 </a>})}
 {rows.length===0&&<div className="wa-result-empty">No hay indicadores que coincidan con el filtro.</div>}
 </div></div>
 <div className="wa-paginator"><button disabled={current<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹ Anterior</button><span>Página {current} de {pages}</span><button disabled={current>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Siguiente ›</button></div>
 </section></div><p className="wa-disclaimer">{role==="Médico"?"La modalidad médica de Doctor Connect todavía no permite acceso a otros pacientes. ":""}Los 4 estados finales son Óptimo, Suficiente, Fuera de rango y Sin resultado. Los resultados importados pendientes de reglas verificadas se presentan como «Confirmado · sin evaluar»; «Todos» y «Con resultado» solo son filtros de navegación. Los datos provienen exclusivamente de la cuenta autenticada. Sin una importación validada, se mostrarán como “Sin resultados”. Las categorías usan el mapa de los 128 indicadores; son organizativas y no equivalen a una evaluación médica. Los estados clínicos permanecerán desactivados hasta que existan reglas aprobadas; no se inventan rangos ni calificaciones clínicas.</p></>
 </main>
}
