const sections = [
 {title:"Mis análisis de sangre",message:"Rafael, tus resultados cuentan una historia.",detail:"Descubre cómo evolucionan tus indicadores.",state:"Migración pendiente"},
 {title:"Dispositivos conectados",message:"Rafael, descubre tu ritmo.",detail:"Sueño, actividad y recuperación en una mirada.",state:"Importador WHOOP pendiente"},
 {title:"Hábitos",message:"Rafael, tus decisiones construyen bienestar.",detail:"Conoce tus rutinas y cómo evolucionan.",state:"Módulo pendiente"}
];
export default function Home(){return <main style={{maxWidth:1000,margin:"auto",padding:"56px 24px"}}>
<p style={{fontSize:12,fontWeight:800,letterSpacing:2,color:"#6e49d8"}}>WELLNESS APP · SPRINT 6.1</p>
<h1 style={{fontSize:"clamp(30px,5vw,52px)",marginBottom:10}}>Fundación de una plataforma longitudinal.</h1>
<p style={{color:"#6b6880",lineHeight:1.6}}>Entorno de desarrollo aislado. El demo publicado se mantiene sin modificaciones.</p>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16,marginTop:32}}>{sections.map(s=><section key={s.title} style={{background:"#fff",border:"1px solid #e8e3f4",borderRadius:18,padding:24}}><small style={{color:"#7868a1"}}>{s.title}</small><h2 style={{fontSize:21,lineHeight:1.25}}>{s.message}</h2><p style={{color:"#757083"}}>{s.detail}</p><small style={{color:"#96752b"}}>{s.state}</small></section>)}</div>
<p style={{marginTop:32,fontSize:12,color:"#777"}}>Este entorno no contiene datos de salud reales ni credenciales.</p></main>}
