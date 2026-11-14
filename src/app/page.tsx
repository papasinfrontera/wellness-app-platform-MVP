const sections=[
 {title:"Mis análisis",description:"Tus indicadores, sus cambios y una perspectiva clara de tu evolución.",icon:"◈",href:"/sprint-6-2/persistencia",state:"Abrir mi espacio"},
 {title:"Actividad y recuperación",description:"Conoce mejor tu ritmo, tu descanso y la energía que acompaña cada día.",icon:"◎",href:null,state:"Próximamente"},
 {title:"Mis hábitos",description:"Comprende cómo tus decisiones diarias construyen bienestar a largo plazo.",icon:"✧",href:null,state:"Próximamente"}
];
export default function Home(){return <main className="well-shell">
 <section className="well-hero"><span className="well-eyebrow">Bienestar con ciencia</span>
 <h1 className="well-title" style={{maxWidth:820}}>Tu salud tiene una historia.<br/><span style={{color:"var(--well-violet)"}}>Empieza a comprenderla.</span></h1>
 <p className="well-subtitle">Un espacio personal para conocer tus indicadores, seguir su evolución y tomar decisiones con información clara y fundamentada en ciencia.</p>
 <div style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:29}}>
 <a className="well-button" href="/sprint-6-2/persistencia" style={{textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Entrar a mi espacio</a>
 <a className="well-button-secondary" href="#explorar" style={{textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Explorar la plataforma</a>
 </div></section>
 <section id="explorar" aria-label="Áreas de bienestar"><div className="well-grid">{sections.map(s=>
 <article key={s.title} className="well-card well-feature">
 <div className="well-feature-icon" aria-hidden="true">{s.icon}</div>
 <h2>{s.title}</h2><p>{s.description}</p>
 {s.href?<a className="well-link" href={s.href}>{s.state} →</a>:<span className="well-tag">{s.state}</span>}
 </article>)}</div></section>
 </main>}
