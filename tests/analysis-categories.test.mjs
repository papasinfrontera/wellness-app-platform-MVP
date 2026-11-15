import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ANALYSIS_CATEGORIES,CATEGORY_CODES,categoryForCode,categoryForId} from "../src/lib/indicator-categories.ts";
const catalog=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
test("128 unique indicators are assigned exactly one of the 11 Wellness categories",()=>{
 assert.equal(ANALYSIS_CATEGORIES.length,11);
 assert.equal(CATEGORY_CODES.length,128);
 assert.equal(new Set(CATEGORY_CODES).size,128);
 for(const entry of catalog){
   const group=categoryForCode(entry.code);
   assert.ok(group!==null && group>=0 && group<11,entry.code);
   assert.equal(categoryForId(entry.id),group,entry.code);
 }
});
test("important imported laboratory indicators have the correct primary category",()=>{
 for(const [code,label] of [
 ["REF-042","Sangre"],["REF-051","Sangre"],["REF-036","Riñones"],
 ["REF-017","Salud metabólica"],["REF-027","Salud digestiva"],
 ["REF-029","Salud digestiva"],["REF-046","Sangre"]
 ])assert.equal(ANALYSIS_CATEGORIES[categoryForCode(code)],label,code);
});
test("ambiguous labels are mapped by catalog code, not by substring",()=>{
 assert.equal(categoryForCode("REF-017"),7);
 assert.equal(categoryForCode("REF-040"),2);
 assert.equal(categoryForCode("REF-119"),4);
 assert.equal(categoryForCode("REF-999"),null);
});
test("clinical optimization labels remain disabled until clinically approved rules are available",()=>{
 const page=readFileSync("src/app/(dashboard)/mi-analisis/page.tsx","utf8");
 assert.match(page,/Confirmado · sin evaluar/);
 assert.ok(page.includes('disabled={(i>=2&&i<=4)'),"Clinical filters remain disabled");
 assert.ok(page.includes('const filters=["Todos","Con resultado","Óptimo","Suficiente","Fuera de rango","Sin resultado"]'),"Exactly four state names");
 assert.ok(page.includes('auth==="ready"?measured:null'),"No false zero without authentication");
 assert.match(page,/categoryForId\(item\.id\)/);
});
