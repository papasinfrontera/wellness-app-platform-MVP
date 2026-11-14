import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const list=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
const clean=s=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const translated=list.filter(i=>i.name_en);
test("catálogo: exactamente 128 identidades únicas",()=>{
 assert.equal(list.length,128);
 assert.equal(new Set(list.map(i=>i.id)).size,128);
});
test("primer lote: exactamente 16 traducidos y los 2 originales preservados",()=>{
 assert.equal(translated.length,16);
 assert.equal(list.find(i=>i.id===1).name,"Apolipoproteína B (ApoB)");
 assert.equal(list.find(i=>i.id===17).name,"Glucosa");
});
for(const row of translated){
 test("etiquetas y referencias bilingües: REF-"+String(row.id).padStart(3,"0"),()=>{
  assert.equal(row.code,"REF-"+String(row.id).padStart(3,"0"));
  assert.ok(row.name.length>2&&row.name_en.length>2);
  assert.ok(Array.isArray(row.aliases));
  const values=[row.name,row.name_en,...row.aliases].map(clean);
  assert.ok(values.includes(clean(row.name)));
  assert.ok(values.includes(clean(row.name_en)));
 });
}
test("sin equivalencias automáticas por coincidencia parcial",()=>{
 assert.equal(list.find(i=>i.id===17).name,"Glucosa");
 assert.notEqual(clean("Glucosa en orina"),clean(list.find(i=>i.id===17).name));
});
test("sin datos de resultados, fecha o identidad médica en el catálogo",()=>{
 for(const row of list){
  for(const name of ["value","valor","measurement","observed_at","birth_date","patient_name","clasificacion_whoop"]){
   assert.equal(Object.hasOwn(row,name),false);
  }
 }
});
