import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {analyzeExtractedText} from "../src/lib/pdf-lab-review.ts";
const catalog=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
// Only test names and SYNTHETIC values. No user medical data or PDF is checked in.
const names=[
"Recuento de Glóbulos Rojos","Hemoglobina","Hematocrito","Volumen Corpuscular Medio (VCM)",
"Hemoglobina Corpuscular Media (HCM)","Concentración de Hb Corp. Media (CHCM)",
"Ancho de Distribución Eritrocitaria (RDW)c","Ancho de Distribución Eritrocitaria (RDW)s",
"Plaquetas","Plaquetocrito","Volumen Plaquetario Medio (MPV)",
"Indice de Distribución Plaquetaria (PDWc)","Glóbulos Blancos",
"Linfocitos (%)","Neutrófilos (%)","Monocitos (%)","Eosinófilos (%)","Basófilos (%)",
"Linfocitos (#)","Neutrófilos (#)","Monocitos (#)","Eosinófilos (#)","Basófilos (#)",
"P_LCR","P_LCC","LIC (#)","Glucosa","Urea","Creatinina","Ácido Úrico",
"Proteínas Totales","Albúmina","Globulina","Índice A/G","Colesterol",
"Triglicéridos","Colesterol HDL","Colesterol LDL Calculado","Colesterol VLDL",
"Apolipoproteína B","Lipoproteina (a)","Bilirrubina Total","Bilirrubina Directa",
"Bilirrubina Indirecta","Transaminasa Oxalacetica TGO","Transaminasa Pirúvica TGP",
"Calcio","Fósforo","Nivel de Nitrógeno Uréico","Hemoglobina Glicada HbA1c",
"VDRL Cualitativo","Sodio","Potasio","Cloro"
];
const percentage=new Set([2,6,9,11,13,14,15,16,17,23,49]);
const counts=new Set([0,8,12,18,19,20,21,22,24,25]);
function unit(i){
 if(i===50)return "—";
 if(i===33)return "—";
 if(i===0)return "10^6/µL";
 if(counts.has(i))return "10^3/µL";
 if(percentage.has(i))return "%";
 if(i===3||i===10||i===7)return "µm³";
 if(i===4)return "pg";
 if(i===1||i===5||i===30||i===31||i===32)return "g/dL";
 if(i===44||i===45)return "U/L";
 if(i>=51)return "mmol/L";
 if(i===49)return "%";
 return "mg/dL";
}
test("all 54 distinct source labels survive a clean positionally reconstructed table",()=>{
 assert.equal(names.length,54);
 const lines=names.map((name,i)=>[name,i===50?"No reactivo":"1.00",unit(i),"0 - 999"].join("\t"));
 const report=analyzeExtractedText(["Indicador\tResultado\tUnidad\tReferencia",...lines,"Página 1","Total: 54"].join("\n"),catalog);
 assert.equal(report.rows.length,54);
 assert.deepEqual(report.rows.map(r=>r.original),names);
 assert.equal(report.rows.filter(r=>r.value==="No reactivo").length,1);
 assert.equal(new Set(report.rows.map(r=>r.id)).size,54);
});
test("known unsafe pairs are never classified as candidates",()=>{
 for(const [name,un] of [
  ["Linfocitos (#)","%"],["Linfocitos (%)","10^3/µL"],
  ["Urea","mg/dL"],["Colesterol VLDL","mg/dL"],
  ["VDRL Cualitativo",""]
 ]){
  const result=analyzeExtractedText(name+"\t"+(name.startsWith("VDRL")?"No reactivo":"1.00")+(un?"\t"+un:""),catalog);
  assert.equal(result.rows.length,1,name);
  assert.equal(result.rows[0].status,"review",name);
 }
});
