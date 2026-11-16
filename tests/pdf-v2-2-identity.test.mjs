import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {analyzeExtractedText} from "../src/lib/pdf-lab-review.ts";
import {curatedIdentity,validateExistingIdentity} from "../src/lib/pdf-indicator-identity.ts";
const catalog=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
test("catalog snapshot is synchronized with publicly authorized alias set",()=>{
 assert.equal(catalog.length,128);
 assert.ok(catalog.reduce((n,c)=>n+(c.aliases?.length||0),0)>=485);
});
test("known synonyms require compatible units and retain explicit user approval",()=>{
 const cases=[
  ["Recuento de Glóbulos Rojos","5.73","10^6/µL","REF-023"],
  ["Concentración de Hb Corp. Media (CHCM)","31","g/dL","REF-009"],
  ["Volumen Plaquetario Medio (MPV)","9.2","fL","REF-046"],
  ["Hemoglobina Glicada HbA1c","5.6","%","REF-019"],
  ["Nivel de Nitrógeno Uréico","19.8","mg/dL","REF-004"],
  ["Colesterol","214","mg/dL","REF-013"]
 ];
 for(const [name,value,unit,code] of cases){
  const row=analyzeExtractedText(name+"\t"+value+"\t"+unit+"\t0 - 999",catalog).rows[0];
  assert.equal(row?.indicatorCode,code,name);
  assert.equal(row?.status,"candidate",name);
 }
});
test("unit mismatch is review-only and cannot silently become candidate",()=>{
 for(const [name,unit] of [
  ["Recuento de Glóbulos Rojos","%"],
  ["Hemoglobina Glicada HbA1c","g/dL"],
  ["Volumen Plaquetario Medio (MPV)","mg/dL"]
 ]){
  const result=curatedIdentity(name,unit);
  assert.equal(result?.status,"review",name);
 }
 assert.equal(validateExistingIdentity("Linfocitos (%)","10^3/µL","REF-043")?.status,"review");
 assert.equal(validateExistingIdentity("Linfocitos (#)","%","REF-044")?.status,"review");
});
test("specific method and unrelated clinical tests never auto-map",()=>{
 const cases=[
  ["Colesterol LDL Calculado","140","mg/dL","REF-005"],
  ["Ancho de Distribución Eritrocitaria (RDW)c","12.3","%","REF-052"]
 ];
 for(const [name,value,unit,code] of cases){
  const row=analyzeExtractedText(name+"\t"+value+"\t"+unit+"\t0 - 999",catalog).rows[0];
  assert.equal(row?.status,"review");
  assert.equal(row?.indicatorCode,code);
 }
 for(const [name,value,unit] of [
  ["Colesterol VLDL","31","mg/dL"],
  ["Urea","42.4","mg/dL"],
  ["VDRL Cualitativo","No reactivo",""]
 ]){
  const row=analyzeExtractedText(name+"\t"+value+(unit?"\t"+unit:""),catalog).rows[0];
  assert.equal(row?.status,"review",name);
  assert.equal(row?.indicatorCode,"",name);
 }
});
test("preserve raw numeric values without exposing real reports in public repository",()=>{
 const x=analyzeExtractedText(["Hemoglobina\t15.4\tg/dL\t13 - 17",
   "Hematocrito\t49\t%\t38 - 55"].join("\n"),catalog);
 assert.equal(x.rows.length,2);
 assert.deepEqual(x.rows.map(r=>r.value),["15.4","49"]);
});
