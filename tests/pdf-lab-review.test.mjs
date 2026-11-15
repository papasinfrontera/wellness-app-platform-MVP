import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {analyzeExtractedText,identifyPdfIndicator,normalizePdfLabel} from "../src/lib/pdf-lab-review.ts";
const catalog=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
test("digital lab rows recognized with no persistence",()=>{
 const r=analyzeExtractedText("Glucose 92 mg/dL\nFerritin 85 ng/mL\nApoB 88 mg/dL",catalog);
 assert.equal(r.rows.length,3);
 assert.deepEqual(r.rows.map(x=>x.indicatorCode),["REF-017","REF-080","REF-001"]);
 assert.ok(r.rows.every(x=>x.status==="candidate"));
 assert.equal(r.rows[0].value,"92");
 assert.equal(r.rows[0].unit,"mg/dL");
});
test("PSA percent and concentration normalization collision blocks automatic candidate",()=>{
 assert.equal(normalizePdfLabel("PSA %, Free"),normalizePdfLabel("PSA, Free"));
 for(const label of ["PSA %, Free","PSA, Free","PSA libre (%)","PSA libre"]){
  const result=identifyPdfIndicator(label,"ng/mL",catalog);
  assert.equal(result.status,"review");
 }
});
test("unit missing requires review",()=>{
 const r=analyzeExtractedText("Glucose 92",catalog);
 assert.equal(r.rows.length,1);
 assert.equal(r.rows[0].status,"review");
});
test("unknown and specimen-modified label cannot auto-map",()=>{
 for(const label of ["Glucose urine","Glucose CSF","Fasting glucose","Glucosa en orina"]){
  assert.equal(identifyPdfIndicator(label,"mg/dL",catalog).status,"review");
 }
});
test("calculated and direct glucose are distinct",()=>{
 const r=analyzeExtractedText("Glucose 92 mg/dL\nEstimated Average Glucose (eAG) 110 mg/dL",catalog);
 assert.equal(r.rows.length,2);
 assert.deepEqual(r.rows.map(x=>x.indicatorCode),["REF-017","REF-016"]);
});
test("empty text warns that OCR may be needed",()=>{
 const r=analyzeExtractedText("",catalog);
 assert.equal(r.rows.length,0);
 assert.match(r.warning||"",/OCR/);
});
test("limit rows and do not import full report",()=>{
 const r=analyzeExtractedText(Array.from({length:100},()=> "Glucosa 90 mg/dL").join("\n"),catalog,8);
 assert.equal(r.rows.length,8);
 assert.equal(r.truncated,true);
});
test("does not produce a patient-facing save payload",()=>{
 const r=analyzeExtractedText("Insulina 12 mIU/L",catalog);
 assert.ok(r.rows.length);
 assert.equal(Object.hasOwn(r,"patient_id"),false);
 assert.equal(Object.hasOwn(r,"save"),false);
});
