import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {analyzeExtractedText,identifyPdfIndicator} from "../src/lib/pdf-lab-review.ts";
const catalog=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
test("positioned four-column PDF preserves original value and separate unit",()=>{
 const r=analyzeExtractedText([
  "Recuento de Glóbulos Rojos\t5.73\t10^6/µL\t4.3 - 5.3",
  "Hemoglobina\t15.40\tg/dL\t13 - 17.5",
  "Volumen Corpuscular Medio (VCM)\t85.6\tµm³\t80 - 100",
  "Glucosa\t96.30\tmg/dL\t70 - 105"
 ].join("\n"),catalog);
 assert.equal(r.rows.length,4);
 assert.deepEqual(r.rows.map(x=>x.unit),["10^6/µL","g/dL","µm³","mg/dL"]);
 assert.equal(r.rows[1].status,"candidate");
 assert.equal(r.rows[3].status,"candidate");
});
test("qualitative VDRL is preserved but not clinically classified or mapped to serum glucose",()=>{
 const r=analyzeExtractedText("VDRL Cualitativo\tNo reactivo\tNo indicado\tSerología",catalog);
 assert.equal(r.rows.length,1);
 assert.equal(r.rows[0].value,"No reactivo");
 assert.equal(r.rows[0].status,"review");
 assert.equal(r.rows[0].indicatorCode,"");
});
test("physical footer, administrative total, and page labels are never observations",()=>{
 const r=analyzeExtractedText([
 "Página 1","Página 2","Total: 54 indicadores","Total: 54",
 "Hemoglobina\t15.4\tg/dL\t13 - 17.5"
 ].join("\n"),catalog);
 assert.equal(r.rows.length,1);
 assert.equal(r.rows[0].original,"Hemoglobina");
});
test("absolute lymphocyte counts cannot be assigned to lymphocyte percentages",()=>{
 const r=analyzeExtractedText("Linfocitos (#)\t2.91\t10³/µL\t0.8 - 4",catalog);
 assert.equal(r.rows.length,1);
 assert.equal(r.rows[0].status,"review");
 assert.notEqual(r.rows[0].indicatorCode,"REF-043");
 assert.equal(r.rows[0].indicatorCode,"REF-044");
});
test("RDW-SD is not silently mapped to RDW-CV",()=>{
 const r=identifyPdfIndicator("Ancho de distribución eritrocitaria (RDWs)","µm³",catalog);
 assert.equal(r.status,"review");
 assert.equal(r.code,"");
});
test("original and reference are distinct even when references begin with a number",()=>{
 const r=analyzeExtractedText("Hematocrito\t49.0\t%\t40 - 50",catalog);
 assert.equal(r.rows.length,1);
 assert.equal(r.rows[0].value,"49.0");
 assert.equal(r.rows[0].unit,"%");
});
