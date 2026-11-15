export type ReferenceIndicator={id:number;code?:string;name:string;name_en?:string;aliases?:string[]};
export type PdfRow={id:string;raw:string;original:string;value:string;unit:string;indicatorCode:string;indicatorName:string;status:"candidate"|"review";reason:string;};
export type PdfReview={rows:PdfRow[];linesExamined:number;truncated:boolean;warning:string|null};
export const normalizePdfLabel=(s:string)=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
const rejectContext=/\b(urin[ae]|urina|orina|urinary|saliva|salival|csf|liquor|lcr|liquido cefalorraquideo|postprandial|posprandial|fasting|ayunas|plasma|serum|suero|capilar|fingerstick|immunoassay|inmunoensayo|calculated|calculado|calculada|25.oh|1.25)\b/i;
const numeric=/^[<>≤≥]?\s*[+-]?\d+(?:[.,]\d+)?$/;
const measure=/^(.+?)\s*(?:\t|\s{2,}|\s*[:;|]\s*|\s+)\s*([<>≤≥]?\s*[+-]?\d+(?:[.,]\d+)?)\s*(mg\s*\/\s*dL|mmol\s*\/\s*L|ng\s*\/\s*mL|pg\s*\/\s*mL|g\s*\/\s*dL|g\s*\/\s*L|mIU\s*\/\s*L|uIU\s*\/\s*mL|µIU\s*\/\s*mL|μIU\s*\/\s*mL|IU\s*\/\s*L|U\s*\/\s*L|µg\s*\/\s*dL|μg\s*\/\s*dL|nmol\s*\/\s*L|pmol\s*\/\s*L|ng\s*\/\s*dL|fL|pg|%|10\^?3\s*\/\s*[µu]L|10\^?6\s*\/\s*[µu]L|mL\s*\/\s*min\s*\/\s*1[.,]73m2)?\s*$/i;
function uniqueMatches(label:string,catalog:ReferenceIndicator[]){
 const key=normalizePdfLabel(label);
 if(!key)return [];
 return catalog.filter(x=>[x.name,x.name_en,...(x.aliases||[])].some(n=>n&&normalizePdfLabel(n)===key));
}
export function identifyPdfIndicator(original:string,unit:string,catalog:ReferenceIndicator[]){
 const matched=uniqueMatches(original,catalog);
 if(matched.length!==1)return {status:"review" as const,code:"",name:"",reason:matched.length>1?"Etiqueta ambigua: coincide con indicadores diferentes.":"Etiqueta sin coincidencia exacta; requiere identificación manual."};
 // A textual match is never a confirmed observation. Detect PSA percent and enforce manual review.
 if(["REF-111","REF-112"].includes(matched[0].code||""))
  return {status:"review" as const,code:matched[0].code||"",name:matched[0].name,reason:"PSA libre: diferenciar porcentaje de concentración y comprobar unidad/método."};
 if(rejectContext.test(original))
  return {status:"review" as const,code:matched[0].code||"",name:matched[0].name,reason:"La etiqueta contiene contexto de muestra o método; requiere revisión."};
 if(!unit)return {status:"review" as const,code:matched[0].code||"",name:matched[0].name,reason:"Unidad no detectada; verificar unidad y tipo de prueba."};
 return {status:"candidate" as const,code:matched[0].code||"",name:matched[0].name,reason:"Coincidencia textual única. Revisar método, unidad, muestra y fecha antes de confirmar."};
}
export function analyzeExtractedText(text:string,catalog:ReferenceIndicator[],maxRows=80):PdfReview{
 if(typeof text!=="string"||!text.trim())return {rows:[],linesExamined:0,truncated:false,warning:"No se detectó texto. Puede tratarse de un PDF escaneado; OCR fuera de este sprint."};
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const rows:PdfRow[]=[];
 for(let i=0;i<lines.length;i++){
  if(rows.length>=maxRows)break;
  const line=lines[i];
  if(line.length>250||line.length<4)continue;
  const m=line.match(measure);
  if(!m)continue;
  const original=m[1].trim(),value=m[2].replace(/\s/g,""),unit=(m[3]||"").replace(/\s/g,"");
  if(original.length<3||original.length>120||!numeric.test(value)||/\d/.test(original)&&!/[a-záéíóúüñ]/i.test(original))continue;
  const match=identifyPdfIndicator(original,unit,catalog);
  rows.push({id:String(i+1),raw:line,original,value,unit,indicatorCode:match.code,indicatorName:match.name,status:match.status,reason:match.reason});
 }
 return {rows,linesExamined:lines.length,truncated:rows.length>=maxRows,warning:rows.length?"Cada resultado requiere confirmación del usuario; no se almacena.":"No se identificaron filas de resultados en el texto. Comprueba el formato del PDF o introduce los resultados manualmente."};
}
