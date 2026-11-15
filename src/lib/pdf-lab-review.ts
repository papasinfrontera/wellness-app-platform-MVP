export type ReferenceIndicator={id:number;code?:string;name:string;name_en?:string;aliases?:string[]};
export type PdfRow={id:string;raw:string;original:string;value:string;unit:string;indicatorCode:string;indicatorName:string;status:"candidate"|"review";reason:string;};
export type PdfReview={rows:PdfRow[];linesExamined:number;truncated:boolean;warning:string|null};
export const normalizePdfLabel=(s:string)=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
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
  return {status:"review" as const,code:"",name:"",reason:"Etiqueta sin coincidencia exacta; requiere identificación manual."};
 }
 const x=matched[0],code=x.code||"";
 if(["REF-111","REF-112"].includes(code))return {status:"review" as const,code,name:x.name,reason:"PSA libre: diferenciar porcentaje de concentración, método y unidad."};
 if(rejectContext.test(original))return {status:"review" as const,code,name:x.name,reason:"La etiqueta contiene información adicional de muestra o método; revisar equivalencia."};
 if(!unit){if(code==="REF-028")return {status:"candidate" as const,code,name:x.name,reason:"Cociente sin unidad; comprobar que sea la relación albúmina/globulina indicada."};return {status:"review" as const,code,name:x.name,reason:"No se identificó unidad; comprobar tipo de prueba."};}
 if(["REF-069","REF-081","REF-085","REF-086","REF-121","REF-122","REF-127"].includes(code))return {status:"review" as const,code,name:x.name,reason:"Prueba dependiente de determinación, fracción, muestra u hora; confirmar con el PDF."};
 return {status:"candidate" as const,code,name:x.name,reason:"Coincidencia textual única. Confirmar muestra, método, unidad y fecha antes de utilizar."};
}
function parseResultCell(raw:string):{value:string;unit:string}|null{
 const str=raw.trim();
 const m=str.match(valueStart);
 if(!m)return null;
 let value=m[1].replace(/\s+/g," ").trim(), remainder=m[2].trim();
 // Retain scientific multiplier as part of the unit, without losing the measured mantissa.
 const sci=remainder.match(/^[×x]\s*10[⁰¹²³⁴⁵⁶⁷⁸⁹]+\s*\/\s*[µμu]L/i);
 if(sci)return {value,unit:sci[0].replace(/\s+/g," ")};
 const unit=remainder.match(unitStart);
 if(unit)return {value,unit:unit[0].replace(/\s+/g,"")};
 // A reference range may follow a unitless value, separated into subsequent columns.
 if(!remainder||/^\s*(?:\d|No indicado|Negativo|Hematolog|Bioquim|Serolog)/i.test(remainder))return {value,unit:""};
 return null;
}
/** Reads only one value cell, never the reference range. PDF text coordinates should insert tabs for column breaks. */
function parseRow(line:string):{original:string;value:string;unit:string}|null{
 const numbered=line.match(/^\s*(\d{1,3})\s+(.*)$/);
 const text=numbered?numbered[2]:line;
 // Preferred: layout reconstruction keeps tab-separated columns.
 const tabs=text.split(/\t+/).map(s=>s.trim()).filter(Boolean);
 if(tabs.length>=2&&tabs[0].length>=2){
  const result=parseResultCell(tabs[1]);
  if(result&&/[a-záéíóúñü]/i.test(tabs[0]))return {original:tabs[0],...result};
 }
 // Fallback for pdf-parse layouts with >=2 spaces between cells.
 const cols=text.split(/\s{2,}/).map(s=>s.trim()).filter(Boolean);
 if(cols.length>=2&&cols[0].length>=2){
  const result=parseResultCell(cols[1]);
  if(result&&/[a-záéíóúñü]/i.test(cols[0]))return {original:cols[0],...result};
 }
 // Single-spacing fallback: include only the FIRST value and unit; ignore reference and area.
 const first=text.match(/^(.+?)\s+((?:Negativo\s*,?\s*)?[<>≤≥]?\s*[+-]?(?:\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)(?:\s*[×x]\s*10[⁰¹²³⁴⁵⁶⁷⁸⁹]+\s*\/\s*[µμu]L)?(?:\s*(?:mg\s*\/\s*dL|mg\s*\/\s*L|mmol\s*\/\s*L|ng\s*\/\s*mL|pg\s*\/\s*mL|g\s*\/\s*dL|g\s*\/\s*L|U\s*\/\s*L|mIU\s*\/\s*L|fL|pg|%|\/?[µμu]L))?)(?=\s|$)/i);
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
  if(line.length>400||line.length<4||/^(?:N\\.?º|N\\.?°|Indicador|Resultado|Valor de referencia|Área|Nombre:|Edad:)/i.test(line))continue;
  // Non-clinical report totals ("Total: 24", "25 Total: 24") are metadata, not readings.
  // Do NOT suppress "Total de celularidad", which is a real complementary line.
  if(/^\\s*(?:\\d{1,3}\\s+)?total\\s*:\\s*\\d+(?:\\s*(?:indicadores|pruebas|analisis|resultados))?\\s*$/i.test(line))continue;
  const parsed=parseRow(line);
  if(!parsed||parsed.original.length>120)continue;
  const {original,value,unit}=parsed,match=identifyPdfIndicator(original,unit,catalog);
  rows.push({id:String(i+1),raw:line,original,value,unit,indicatorCode:match.code,indicatorName:match.name,status:match.status,reason:match.reason});
 }
 return {rows,linesExamined:lines.length,truncated:rows.length>=maxRows,warning:rows.length?"Resultados extraídos para revisión; no se almacena ninguno.":"No se identificaron filas: comprueba el formato del PDF o revisa manualmente."};
}
