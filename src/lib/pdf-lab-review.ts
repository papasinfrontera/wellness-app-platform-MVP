import {curatedIdentity,validateExistingIdentity} from "./pdf-indicator-identity.ts";
export type ReferenceIndicator={id:number;code?:string;name:string;name_en?:string;aliases?:string[]};
export type PdfRow={id:string;raw:string;original:string;value:string;unit:string;indicatorCode:string;indicatorName:string;status:"candidate"|"review";reason:string;};
export type PdfReview={rows:PdfRow[];linesExamined:number;truncated:boolean;warning:string|null};
export const normalizePdfLabel=(s:string)=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
export type UnmatchedKind="unmapped"|"qualitative"|"complementary";
export function classifyUnmatchedReading(label:string,value:string):UnmatchedKind{
 const k=normalizePdfLabel(label);
 if(k==="total de celularidad"||k==="total celularidad")return "complementary";
 if(/^(?:negativo|positivo|reactivo|no reactivo|indetectable)\b/i.test(value.trim())||/proteina c reactiva/.test(k))return "qualitative";
 return "unmapped";
}
const rejectContext=/\b(urin[ae]|urina|orina|urinary|saliva|salival|csf|liquor|lcr|liquido cefalorraquideo|postprandial|posprandial|fasting|ayunas|plasma|serum|suero|capilar|fingerstick|immunoassay|inmunoensayo|calculated|calculado|calculada|25.oh|1.25)\b/i;
const numeric=/^[<>≤≥]?\s*[+-]?\d+(?:[.,]\d+)?$/;
const valueStart=/^(Negativo\s*,?\s*[<>≤≥]?\s*\d+(?:[.,]\d+)?|[<>≤≥]?\s*[+-]?(?:\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?))(.*)$/i;
const unitStart=/^(?:mg\s*\/\s*dL|mg\s*\/\s*L|mmol\s*\/\s*L|ng\s*\/\s*mL|pg\s*\/\s*mL|g\s*\/\s*dL|g\s*\/\s*L|mIU\s*\/\s*L|uIU\s*\/\s*mL|µIU\s*\/\s*mL|μIU\s*\/\s*mL|IU\s*\/\s*L|U\s*\/\s*L|µg\s*\/\s*dL|μg\s*\/\s*dL|nmol\s*\/\s*L|pmol\s*\/\s*L|ng\s*\/\s*dL|fL|pg|%|\/?[µμu]L|10[⁰¹²³⁴⁵⁶⁷⁸⁹]+\s*\/\s*[µμu]L|mL\s*\/\s*min\s*\/\s*1[.,]73m2)/i;
function uniqueMatches(label:string,catalog:ReferenceIndicator[]){
 const key=normalizePdfLabel(label);
 if(!key)return [];
 return catalog.filter(x=>[x.name,x.name_en,...(x.aliases||[])].some(n=>n&&normalizePdfLabel(n)===key));
}
export function identifyPdfIndicator(original:string,unit:string,catalog:ReferenceIndicator[]){
 const labelKey=normalizePdfLabel(original);
 // Absolute differentials and percentages are distinct determinations. Preserve
 // '#' and '%' semantics before applying the punctuation-stripping normalizer.
 const countCodes:Record<string,string>={
  linfocitos:"REF-044",neutrofilos:"REF-050",monocitos:"REF-048",eosinofilos:"REF-038",basofilos:"REF-032"
 };
 if(/\(\s*#\s*\)/.test(original)){
  const base=normalizePdfLabel(original).replace(/\s+/g," ").trim();
  const countCode=countCodes[base];
  const candidate=catalog.find(x=>x.code===countCode);
  if(candidate)return {status:"review" as const,code:countCode,name:candidate.name,reason:"Recuento absoluto identificado; comprobar unidad de recuento, muestra y método. No corresponde al porcentaje."};
  return {status:"review" as const,code:"",name:"",reason:"Recuento absoluto sin correspondencia segura; nunca asignar al porcentaje."};
 }
 // Footers and method/specimen qualifiers must not become automatic identities.
 if(/\b(?:rdws|rdw s)\b/.test(labelKey))return {status:"review" as const,code:"",name:"",reason:"RDW-SD no equivale a RDW-CV; requiere indicador y unidad específicos."};
 // Curated synonyms are checked before raw text matching. Never trust a fuzzy match.
 const vetted=curatedIdentity(original,unit);
 if(vetted){
  const indicator=catalog.find(c=>c.code===vetted.code);
  if(indicator)return {status:vetted.status,code:vetted.code,name:indicator.name,reason:vetted.reason};
 }
 const matched=uniqueMatches(original,catalog);
 if(matched.length>1)return {status:"review" as const,code:"",name:"",reason:"Etiqueta ambigua: coincide con indicadores diferentes."};
 if(matched.length===0){
  // Limited contextual hints for cell-type counts. Never auto-confirm an inferred identity.
  const k=normalizePdfLabel(original);
  const hint:Record<string,string>={
   "globulos rojos":"REF-023","globulos blancos":"REF-025",
   "neutrofilos":"REF-049","linfocitos":"REF-043","monocitos":"REF-047",
   "volumen plaquetario medio":"REF-046","glicemia basal":"REF-017",
   "transaminasa oxalacetica tgo ast":"REF-030",
   "transaminasa oxalacetica tgo":"REF-030",
   "transaminasa oxalacetica":"REF-030",
   "transaminasa piruvica tgp alt":"REF-026",
   "transaminasa piruvica tgp":"REF-026",
   "transaminasa piruvica":"REF-026"
  };
  const code=hint[k]||"";
  const suggested=catalog.find(x=>x.code===code);
  if(code&&suggested)return {status:"review" as const,code,name:suggested.name,reason:code==="REF-017"?"Glucemia basal: posible glucosa medida; confirmar ayuno, muestra y método.":(["REF-030","REF-026"].includes(code)?"Sinónimo de transaminasa detectado; confirmar AST/ALT, tipo de muestra y unidad antes de aprobar.":"Correspondencia orientativa: revisar magnitud, muestra, método y unidad.")};
  if(k==="urea"||k==="urea serica"){
   return {status:"review" as const,code:"",name:"",reason:"Urea total no equivale a nitrógeno ureico (BUN). Conservar pendiente hasta incorporar el indicador específico y comprobar la unidad."};
  }
  if(k==="colesterol vldl"||k==="vldl colesterol"||k==="colesterol de lipoproteinas de muy baja densidad"){
   return {status:"review" as const,code:"",name:"",reason:"VLDL no es LDL ni colesterol total. Conservar pendiente; verificar si el resultado fue medido o calculado."};
  }
  if(k==="total de celularidad"||k==="total celularidad"){
   return {status:"review" as const,code:"",name:"",reason:"Dato complementario del diferencial: no asignar un indicador clínico independiente sin validación."};
  }
  if(k==="proteina c reactiva pcr"||k==="proteina c reactiva"){
   return {status:"review" as const,code:"",name:"",reason:"PCR convencional o resultado cualitativo: no asociar a PCR ultrasensible sin verificar el método."};
  }
  return {status:"review" as const,code:"",name:"",reason:"Etiqueta sin coincidencia exacta; requiere identificación manual."};
 }
 const x=matched[0],code=x.code||"";
 const invalid=validateExistingIdentity(original,unit,code);
 if(invalid)return {status:invalid.status,code:invalid.code,name:invalid.code?x.name:"",reason:invalid.reason};
 if(["REF-111","REF-112"].includes(code))return {status:"review" as const,code,name:x.name,reason:"PSA libre: diferenciar porcentaje de concentración, método y unidad."};
 if(rejectContext.test(original))return {status:"review" as const,code,name:x.name,reason:"La etiqueta contiene información adicional de muestra o método; revisar equivalencia."};
 if(!unit){if(code==="REF-028")return {status:"candidate" as const,code,name:x.name,reason:"Cociente sin unidad; comprobar que sea la relación albúmina/globulina indicada."};return {status:"review" as const,code,name:x.name,reason:"No se identificó unidad; comprobar tipo de prueba."};}
 if(["REF-069","REF-081","REF-085","REF-086","REF-121","REF-122","REF-127"].includes(code))return {status:"review" as const,code,name:x.name,reason:"Prueba dependiente de determinación, fracción, muestra u hora; confirmar con el PDF."};
 return {status:"candidate" as const,code,name:x.name,reason:"Coincidencia textual única. Confirmar muestra, método, unidad y fecha antes de utilizar."};
}
// Units can live in their own positioned PDF column; never read a range as a unit.
const possibleUnit=/^(?:[×x]\s*)?(?:10(?:\^?[369]|[³⁶⁹])\s*\/\s*[µμu]L|(?:[µμu]m(?:³|\^3)|fL|pg|%|g\s*\/\s*dL|mg\s*\/\s*dL|mg\s*\/\s*L|mmol\s*\/\s*L|U\s*\/\s*L|ng\s*\/\s*mL|(?:[µμu]L|\/[µμu]L)))(?!\w)/i;
const qualitative=/^(?:no\s+reactivo|reactivo|no\s+detectado|indetectable|negativo|positivo|normal|amarillo|límpido|limpido|escasa|escasas)$/i;
function parseResultCell(raw:string):{value:string;unit:string}|null{
 const str=raw.trim().replace(/\s+/g," ");
 if(qualitative.test(str))return {value:str,unit:""};
 const m=str.match(valueStart);
 if(!m)return null;
 const value=m[1].trim(),rest=m[2].trim();
 const u=rest.match(possibleUnit);
 if(u)return {value,unit:u[0].trim().replace(/\s*\/\s*/g,"/").replace(/^([×x])\s*(10)/,"$1 $2")};
 if(!rest||/^(?:\d|No indicado|Negativo|Hematolog|Bioquim|Serolog)/i.test(rest))return {value,unit:""};
 return null;
}
function fromColumns(cols:string[]):{original:string;value:string;unit:string}|null{
 if(cols.length<2||cols[0].length<2||!/[\p{L}]/u.test(cols[0]))return null;
 const parsed=parseResultCell(cols[1]);
 if(!parsed)return null;
 let unit=parsed.unit;
 if(!unit&&cols.length>=3){
  const standalone=cols[2].trim().match(possibleUnit);
  if(standalone)unit=standalone[0].replace(/\s+/g,"");
 }
 return {original:cols[0],value:parsed.value,unit};
}
/** Parse one reconstructed visual row; no reference interval can become the measured value. */
function parseRow(line:string):{original:string;value:string;unit:string}|null{
 const numbered=line.match(/^\s*(\d{1,3})\s+(.*)$/);
 const text=numbered?numbered[2]:line;
 const tabs=text.split(/\t+/).map(s=>s.trim()).filter(Boolean);
 const byTabs=fromColumns(tabs);
 if(byTabs)return byTabs;
 const cols=text.split(/\s{2,}/).map(s=>s.trim()).filter(Boolean);
 const bySpaces=fromColumns(cols);
 if(bySpaces)return bySpaces;
 // Single-spacing fallback supports qualitative values while never consuming reference ranges.
 const first=text.match(/^(.+?)\s+((?:no\s+reactivo|reactivo|no\s+detectado|indetectable|negativo|positivo|normal|amarillo|límpido|limpido|escasa|escasas)|(?:negativo\s*,?\s*)?[<>≤≥]?\s*[+-]?(?:\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)(?:\s*[×x]\s*10[⁰¹²³⁴⁵⁶⁷⁸⁹]+\s*\/\s*[µμu]L)?(?:\s*(?:mg\s*\/\s*dL|mg\s*\/\s*L|mmol\s*\/\s*L|ng\s*\/\s*mL|pg\s*\/\s*mL|g\s*\/\s*dL|g\s*\/\s*L|U\s*\/\s*L|[µμu]m³|fL|pg|%|\/?[µμu]L))?)(?=\s|$)/i);
 if(!first)return null;
 const parsed=parseResultCell(first[2]);
 if(!parsed||first[1].length<2||!/\p{L}/u.test(first[1]))return null;
 return {original:first[1].trim(),...parsed};
}
export function analyzeExtractedText(text:string,catalog:ReferenceIndicator[],maxRows=80):PdfReview{
 if(typeof text!=="string"||!text.trim())return {rows:[],linesExamined:0,truncated:false,warning:"No se detectó texto. Puede tratarse de un PDF escaneado; OCR fuera de este sprint."};
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const rows:PdfRow[]=[];
 for(let i=0;i<lines.length;i++){
  if(rows.length>=maxRows)break;
  const line=lines[i];
  if(line.length>400||line.length<4||/^(?:N\.?º|N\.?°|Indicador|Resultado|Valor de referencia|Área|Nombre:|Edad:|Página\s*\d*\s*$|P[aá]gina\s*\d*\s*$)/i.test(line))continue;
  // HDL and other reference legends are *not* measured indicators. In the
  // test report they occur on independent lines: "Bajo: <55 / Moderado: ..."
  // and "Alto: >35". Without this guard they become two false observations.
  if(/^(?:bajo|alto|moderado|intermedio|deseable|riesgo\s+(?:alto|bajo)|low|high|normal\s+range)\s*:/i.test(line))continue;
  // A report count is metadata, not a lab observation. "Total de celularidad" stays.
  if(/^\s*(?:\d{1,3}\s+)?total\s*:\s*\d+(?:\s*(?:indicadores|pruebas|an[aá]lisis|resultados))?\s*$/i.test(line))continue;
  const parsed=parseRow(line);
  if(!parsed||parsed.original.length>120)continue;
  const {original,value,unit}=parsed,match=identifyPdfIndicator(original,unit,catalog);
  rows.push({id:String(i+1),raw:line,original,value,unit,indicatorCode:match.code,indicatorName:match.name,status:match.status,reason:match.reason});
 }
 return {rows,linesExamined:lines.length,truncated:rows.length>=maxRows,warning:rows.length?"Resultados extraídos para revisión; no se almacena ninguno.":"No se identificaron filas: comprueba el formato del PDF o revisa manualmente."};
}
