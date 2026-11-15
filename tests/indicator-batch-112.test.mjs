import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
test("128 identities and 112 Spanish labels",()=>{
 assert.equal(data.length,128);
 assert.equal(new Set(data.map(x=>x.id)).size,128);
 assert.equal(data.filter(x=>x.name_en).length,112);
});
for(let id=97;id<=112;id++)test("bilingual original + stable code REF-"+id,()=>{
 const x=data.find(v=>v.id===id);
 assert.ok(x);
 assert.equal(x.code,"REF-"+String(id).padStart(3,"0"));
 assert.ok(x.name&&x.name_en&&x.aliases.length);
});
test("percent-free PSA distinct from free PSA concentration",()=>{
 const ratio=data.find(x=>x.id===111),quantity=data.find(x=>x.id===112);
 assert.notEqual(ratio.code,quantity.code);
 assert.match(ratio.name,/Porcentaje/);
 assert.doesNotMatch(quantity.name,/Porcentaje/);
});
test("LDL particle number, peak size and particle pattern remain distinct",()=>{
 assert.equal(new Set([98,99,100].map(id=>data.find(x=>x.id===id).code)).size,3);
});
test("omega 3 and omega 6 and their ratio remain distinct",()=>{
 assert.equal(new Set([108,109,110].map(id=>data.find(x=>x.id===id).code)).size,3);
});
test("no clinical values or patient results embedded",()=>{
 for(const x of data)for(const k of ["patient","value","unit","reference_range","observed_at","result","formula"])
 assert.equal(Object.hasOwn(x,k),false);
});
