import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditCatalog,normalizeLossy} from "../scripts/audit-indicator-catalog.mjs";
const catalog=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
const report=auditCatalog(catalog);
test("128 bilingual catalog identities intact",()=>{assert.equal(report.total,128);assert.equal(report.unique_codes,128);assert.equal(report.unique_ids,128);assert.equal(report.complete_bilingual,128);});
test("audit finds PSA punctuation collisions, blocking auto-match",()=>{
 const c=report.collisions;
 assert.ok(c.some(x=>x.codes.includes("REF-111")&&x.codes.includes("REF-112")&&x.normalized==="psa free"));
 assert.ok(c.some(x=>x.codes.includes("REF-111")&&x.codes.includes("REF-112")&&x.normalized==="psa libre"));
 assert.equal(c.length,2);
});
test("the normalized PSA labels are not safe keys for clinical identification",()=>{
 assert.equal(normalizeLossy("PSA %, Free"),normalizeLossy("PSA, Free"));
 assert.equal(normalizeLossy("PSA libre (%)"),normalizeLossy("PSA libre"));
});
test("ambiguous and method-specific labels remain separately identified",()=>{
 for(const [x,y] of [[16,17],[35,33],[72,78],[85,86],[111,112],[112,113],[121,122]]){
  assert.notEqual(catalog.find(i=>i.id===x).code,catalog.find(i=>i.id===y).code);
 }
});
test("no personal result values and no clinical equivalence inferred from aliases",()=>{
 for(const x of catalog)for(const k of ["value","patient","reference_range","result","observed_at","method","specimen"]){
  assert.equal(Object.hasOwn(x,k),false);
 }
});
