import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
test("128 IDs preserved, 80 Spanish translations",()=>{
 assert.equal(data.length,128);
 assert.equal(new Set(data.map(x=>x.id)).size,128);
 assert.equal(data.filter(x=>x.name_en).length,80);
});
for(let id=65;id<=80;id++)test("original identity and aliases: REF-"+id,()=>{
 const x=data.find(v=>v.id===id);
 assert.ok(x);
 assert.equal(x.code,"REF-"+String(id).padStart(3,"0"));
 assert.ok(x.name&&x.name_en);
 assert.ok(Array.isArray(x.aliases)&&x.aliases.length>=1);
});
test("Cystatin and eGFR remain distinct indicators",()=>{
 const codes=[71,72,78].map(id=>data.find(x=>x.id===id).code);
 assert.equal(new Set(codes).size,3);
});
test("not conflate direct glucose, estimated glucose and C-peptide",()=>{
 const codes=[17,16,65].map(id=>data.find(x=>x.id===id).code);
 assert.equal(new Set(codes).size,3);
});
test("no patient observations, units, ranges or computed values in catalog",()=>{
 for(const x of data)for(const key of ["patient","value","unit","reference_range","observed_at","result","formula"]){
  assert.equal(Object.hasOwn(x,key),false);
 }
});
