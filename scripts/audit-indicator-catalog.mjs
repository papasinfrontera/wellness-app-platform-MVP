import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
export const normalizeLossy=(v)=>v.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
/** THIS IS A COLLISION AUDIT, NOT A CLINICAL MATCHING OR PDF IMPORT ENGINE. */
export function auditCatalog(catalog){
 const map=new Map();
 const all=[];
 for(const item of catalog){
  for(const label of [item.name,item.name_en,...(item.aliases||[])]){
   const n=normalizeLossy(label);
   const match={code:item.code,label};
   all.push(match);
   map.set(n,[...(map.get(n)||[]),match]);
  }
 }
 const collisions=[...map.entries()].filter(([,rows])=>new Set(rows.map(x=>x.code)).size>1).map(([normalized,rows])=>({
  normalized,labels:[...new Set(rows.map(x=>x.label))],
  codes:[...new Set(rows.map(x=>x.code))].sort(),
  severity:"blocker"
 })).sort((a,b)=>a.normalized.localeCompare(b.normalized));
 const codes=new Set(catalog.map(x=>x.code));
 return {total:catalog.length,unique_ids:new Set(catalog.map(x=>x.id)).size,unique_codes:codes.size,
  complete_bilingual:catalog.filter(x=>typeof x.name==="string"&&x.name.trim()&&typeof x.name_en==="string"&&x.name_en.trim()).length,
  label_entries:all.length,unique_normalized_keys:map.size,collisions};
}
const self=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(self){const catalog=JSON.parse(readFileSync(new URL("../src/app/(dashboard)/mi-analisis/catalog-reference.json",import.meta.url),"utf8"));console.log(JSON.stringify(auditCatalog(catalog),null,2));}
