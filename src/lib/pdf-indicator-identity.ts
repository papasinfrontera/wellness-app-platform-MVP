/**
 * Clinical-identity guardrail for PDF previews.
 * Versioned curated aliases are intentionally conservative:
 * a possible synonym must match a specimen-compatible result unit.
 * "candidate" is a textual candidate for USER REVIEW, never a diagnosis.
 */
export type IdentityDecision={status:"candidate"|"review";code:string;reason:string};
const normalize=(text:string)=>text.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
const aliases:Record<string,{code:string;methodSensitive?:boolean}>={
 "recuento de globulos rojos":{code:"REF-023"},
 "concentracion de hb corp media chcm":{code:"REF-009"},
 "volumen plaquetario medio mpv":{code:"REF-046"},
 "hemoglobina glicada hba1c":{code:"REF-019"},
 "nivel de nitrogeno ureico":{code:"REF-004"},
 "colesterol":{code:"REF-013"},
 "indice a g":{code:"REF-028"},
 "colesterol ldl calculado":{code:"REF-005",methodSensitive:true},
 "ancho de distribucion eritrocitaria rdwc":{code:"REF-052",methodSensitive:true}
};
const units:Record<string,RegExp>={
 "REF-023":/^10\^?6\/[µμu]l$/i,
 "REF-009":/^g\/dl$/i,
 "REF-046":/^(?:fl|[µμu]m(?:3|³))$/i,
 "REF-019":/^%$/,
 "REF-004":/^mg\/dl$/i,
 "REF-013":/^mg\/dl$/i,
 "REF-028":/^$/,
 "REF-005":/^mg\/dl$/i,
 "REF-052":/^%$/
};
const countUnit=/^10\^?3\/[µμu]l$/i;
const semanticDifference=/(?:\(\s*#\s*\)|\(\s*%\s*\)|\b(?:calculado|calculada|rdws|rdwc|fraccion|libre|orina|urinari[ao]|suero|plasma|serum|s[eé]ric[ao])\b)/i;
export function canonicalUnit(unit:string):string{
 return unit.trim().toLowerCase().replace(/\s/g,"").replace(/[μu]/g,"µ").replace(/[⁶]/g,"6").replace(/[³]/g,"3").replace(/[×x](?=10)/g,"").replace(/10(?:\^)?([36])/g,"10^$1");
}
export function curatedIdentity(original:string,unit:string):IdentityDecision|null{
 const key=normalize(original),entry=aliases[key];if(!entry)return null;
 const normalized=canonicalUnit(unit);
 const compatible=units[entry.code]?.test(normalized)??false;
 if(!compatible)return {status:"review",code:entry.code,reason:"Equivalencia conocida, pero la unidad está ausente o no es compatible con la determinación: revisar muestra, método y magnitud."};
 if(entry.methodSensitive)return {status:"review",code:entry.code,reason:"Equivalencia orientativa con método específico; verificar que el indicador admita esta variante antes de confirmar."};
 return {status:"candidate",code:entry.code,reason:"Sinónimo controlado y unidad compatible; confirmar muestra, fecha y método antes de almacenar."};
}
export function validateExistingIdentity(original:string,unit:string,code:string):IdentityDecision|null{
 const key=normalize(original),normalized=canonicalUnit(unit);
 // No clinical unit validation possible for qualitative results with numeric codes.
 if(/^(?:no\s+reactivo|reactivo|negativo|positivo)$/i.test(unit.trim()))return {status:"review",code,reason:"El resultado cualitativo exige una determinación específica."};
 if(/\b(?:orina|urinari[ao]|saliva|lcr)\b/i.test(original))return {status:"review",code:"",reason:"Muestra distinta de sangre: evitar equivalencias automáticas."};
 // Once a PDF label specifies percent or absolute cells, verify the matching code family.
 const percentFamily=new Set(["REF-043","REF-049","REF-047","REF-037","REF-031"]);
 const absoluteFamily=new Set(["REF-044","REF-050","REF-048","REF-038","REF-032"]);
 const labelAbsolute=/\(\s*#\s*\)/.test(original)||/\b(?:absoluto|absolutos|recuento)\b/i.test(original)&&absoluteFamily.has(code);
 const labelPercent=/\(\s*%\s*\)/.test(original);
 if((labelAbsolute&&percentFamily.has(code))||(labelPercent&&absoluteFamily.has(code)))
  return {status:"review",code:"",reason:"Porcentaje y recuento absoluto no son intercambiables."};
 if(absoluteFamily.has(code)&&!countUnit.test(normalized))
  return {status:"review",code,reason:"Unidad incompatible con recuento absoluto; se requiere recuento por volumen."};
 if(percentFamily.has(code)&&normalized!=="%")
  return {status:"review",code,reason:"Unidad incompatible con porcentaje leucocitario."};
 // Do not auto-approve a match if its name embeds method or specimen qualifiers.
 if(semanticDifference.test(original)&&!labelPercent&&!labelAbsolute)
  return {status:"review",code,reason:"La etiqueta incluye información de muestra, método o variante de la medición."};
 const allowed=units[code];
 if(allowed&&!allowed.test(normalized))
  return {status:"review",code,reason:"La unidad indicada es incompatible con la identidad propuesta; revisar antes de guardar."};
 return null;
}
