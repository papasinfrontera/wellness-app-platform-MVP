export type PilotMatch =
  | {status:"candidate";code:"REF-001"|"REF-017";name_es:string;reason:string}
  | {status:"review";code:null;name_es:null;reason:string};
type Entry={code:"REF-001"|"REF-017";name_es:string;aliases:readonly string[]};
const PILOT:readonly Entry[]=[
 {code:"REF-001",name_es:"Apolipoproteína B (ApoB)",aliases:["Apolipoproteína B (ApoB)","Apolipoproteína B","Apolipoprotein B (ApoB)","Apolipoprotein B","ApoB","Apo B"]},
 {code:"REF-017",name_es:"Glucosa",aliases:["Glucosa","Glicemia","Glucemia","Glucose","Blood glucose","Glucosa en sangre"]}
];
const normalize=(text:string)=>text.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").replace(/[\s\u00a0]+/g," ").trim().replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ");
/**
 * Exact name/alias recognition only. A match is a review candidate, NEVER a
 * validated clinical observation. No PDF parsing, unit conversion, saving
 * or auto-approval happens here.
 */
export function recognizePilotLabel(rawLabel:string):PilotMatch{
 if(typeof rawLabel!=="string"||rawLabel.length>180||rawLabel.trim().length===0)
  return {status:"review",code:null,name_es:null,reason:"Etiqueta vacía o demasiado larga; revisar manualmente."};
 // Only strip explicitly recognized unit suffix; do not strip specimen or method.
 const label=rawLabel.trim().replace(/\s*\((?:mg\s*\/\s*dL|mmol\s*\/\s*L)\)\s*$/i,"");
 const key=normalize(label);
 const matches=PILOT.filter(p=>p.aliases.some(a=>normalize(a)===key));
 if(matches.length!==1)return {status:"review",code:null,name_es:null,reason:matches.length>1?"Coincidencia ambigua; revisar antes de vincular.":"Sin equivalencia exacta o con calificadores adicionales; revisar muestra, método y unidad."};
 return {status:"candidate",code:matches[0].code,name_es:matches[0].name_es,reason:"Equivalencia textual del piloto. Requiere confirmar muestra, método, unidad y aprobación del usuario."};
}
