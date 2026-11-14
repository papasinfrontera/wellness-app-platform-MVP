import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
const ids=[28,35,39,52,53,54,55,56,57,58,59,60,61,62,63,64];
test("128 unchanged identities and 64 translations",()=>{
 assert.equal(data.length,128);
 assert.equal(new Set(data.map(x=>x.id)).size,128);
 assert.equal(data.filter(x=>x.name_en).length,64);
});
for(const id of ids)test("bilingual mapping REF-"+id,()=>{
 const x=data.find(x=>x.id===id);
 assert.ok(x);
 assert.equal(x.code,"REF-"+String(id).padStart(3,"0"));
 assert.ok(x.name&&x.name_en&&x.name!==x.name_en);
 assert.ok(Array.isArray(x.aliases)&&x.aliases.length>0);
});
for(const [a,b] of [[35,33],[39,26],[54,20],[57,17],[63,62]]){
 test("derived quantity has separate identity: "+a+" vs "+b,()=>{
  const p=data.find(x=>x.id===a),q=data.find(x=>x.id===b);
  assert.notEqual(p.id,q.id);
  assert.notEqual(p.name,q.name);
 });
}
test("catalog excludes patient results and scientific thresholds",()=>{
 for(const x of data)for(const name of ["patient","measurement","result","value","reference_range","clinical_threshold","observed_at"]){
  assert.equal(Object.hasOwn(x,name),false);
 }
});
