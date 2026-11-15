import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
test("128 IDs preserved, 96 Spanish translations",()=>{
 assert.equal(data.length,128);
 assert.equal(new Set(data.map(x=>x.id)).size,128);
 assert.equal(data.filter(x=>x.name_en).length,96);
});
for(let id=81;id<=96;id++)test("original identity and aliases: REF-"+id,()=>{
 const x=data.find(v=>v.id===id);
 assert.ok(x);
 assert.equal(x.code,"REF-"+String(id).padStart(3,"0"));
 assert.ok(x.name&&x.name_en);
 assert.ok(Array.isArray(x.aliases)&&x.aliases.length>=1);
});
test("measured and calculated free testosterone are distinct",()=>{
 const a=data.find(x=>x.id===85),b=data.find(x=>x.id===86);
 assert.notEqual(a.code,b.code);
 assert.match(b.name,/calculada/);
 assert.doesNotMatch(a.name,/calculada/);
});
test("T3 and T4 free remain distinct",()=>{
 const a=data.find(x=>x.id===83),b=data.find(x=>x.id===84);
 assert.notEqual(a.code,b.code);
 assert.match(a.name,/T3 libre/);
 assert.match(b.name,/T4 libre/);
});
test("iron and percentage transferrin saturation remain distinct",()=>{
 const a=data.find(x=>x.id===95),b=data.find(x=>x.id===96);
 assert.notEqual(a.code,b.code);
 assert.match(b.name,/\(%\)/);
});
test("catalog excludes sensitive values and clinical interpretation",()=>{
 for(const x of data)for(const k of ["patient","value","unit","reference_range","observed_at","result","formula"]){
  assert.equal(Object.hasOwn(x,k),false);
 }
});
