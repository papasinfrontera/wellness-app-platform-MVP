import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
test("128 of 128 Spanish indicators, stable IDs and codes",()=>{
 assert.equal(data.length,128);
 assert.equal(new Set(data.map(x=>x.id)).size,128);
 assert.equal(new Set(data.map(x=>x.code)).size,128);
 assert.equal(data.filter(x=>x.name_en).length,128);
});
for(let id=113;id<=128;id++)test("bilingual REF-"+id,()=>{
 const x=data.find(v=>v.id===id);
 assert.ok(x);
 assert.equal(x.code,"REF-"+String(id).padStart(3,"0"));
 assert.ok(x.name&&x.name_en&&Array.isArray(x.aliases)&&x.aliases.length);
});
test("PSA percentage, free concentration and total PSA are distinct",()=>{
 const names=[111,112,113].map(id=>data.find(x=>x.id===id));
 assert.equal(new Set(names.map(x=>x.code)).size,3);
 assert.match(names[0].name,/Porcentaje/);
 assert.match(names[1].name,/libre/);
 assert.match(names[2].name,/total/);
});
test("testosterone methods and free hormones are distinct",()=>{
 assert.equal(new Set([85,86,121,122].map(id=>data.find(x=>x.id===id).code)).size,4);
 assert.match(data.find(x=>x.id===122).name,/inmunoensayo/);
});
test("TIBC does not conflate with iron and vitamin D is not specifically 25-OH",()=>{
 assert.equal(new Set([95,96,125].map(id=>data.find(x=>x.id===id).code)).size,3);
 assert.equal(data.find(x=>x.id===127).name,"Vitamina D");
});
test("catalog includes no clinical/patient observations",()=>{
 for(const x of data)for(const k of ["value","unit","patient","observed_at","reference_range","clinical_threshold","diagnosis","formula"]){
  assert.equal(Object.hasOwn(x,k),false);
 }
});
