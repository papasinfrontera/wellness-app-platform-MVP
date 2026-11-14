import type {ReactNode} from "react";
export default function ModulePreview({eyebrow,title,intro,items,note,children}:{eyebrow:string;title:string;intro:string;items:string[];note:string;children?:ReactNode}){
 return <main><span className="wb-eyebrow">{eyebrow}</span><h1 className="wb-page-title">{title}</h1><p className="wb-lead">{intro}</p>
  <div className="wb-state" style={{marginTop:32,maxWidth:840}}>
   <div style={{display:"inline-block",fontWeight:800,fontSize:11,letterSpacing:".08em",color:"#5B40F5",background:"#F0EFFE",borderRadius:40,padding:"9px 12px"}}>EN DESARROLLO</div>
   <h2 style={{margin:"18px 0 8px",letterSpacing:"-.03em"}}>Una experiencia pensada para ti.</h2>
   <p style={{fontSize:13,color:"#787581",lineHeight:1.65,maxWidth:650}}>{note}</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:12,marginTop:24}}>{items.map(item=><div key={item} style={{border:"1px solid #E9E8ED",borderRadius:12,padding:16,fontSize:13,fontWeight:700,background:"#FCFBFE"}}>{item}</div>)}</div>
   {children}
   <div style={{display:"flex",gap:13,flexWrap:"wrap",marginTop:26}}><a href="/mi-bienestar" className="wb-action" style={{marginTop:0}}>Volver a Mi bienestar</a><a href="/mi-perfil" style={{padding:"13px 8px",fontSize:13,fontWeight:700,color:"#5B40F5"}}>Mi perfil ↗</a></div>
  </div></main>
}
