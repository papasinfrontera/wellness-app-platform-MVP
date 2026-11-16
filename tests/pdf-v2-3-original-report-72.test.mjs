import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {analyzeExtractedText} from "../src/lib/pdf-lab-review.ts";
const catalog=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
// Provenance: original four-page lab document, only test labels retained.
// All result values below are synthetic. No patient-identifying information is committed.
const blood=[
  "Recuento de Glóbulos Rojos",
  "Hemoglobina",
  "Hematocrito",
  "Volumen Corpuscular Medio (VCM)",
  "Hemoglobina Corpuscular Media (HCM)",
  "Concentración de Hb Corp. Media (CHCM)",
  "Ancho de Distribución Eritrocitaria (RDW)c",
  "Ancho de Distribución Eritrocitaria (RDW)s",
  "Plaquetas",
  "Plaquetocrito",
  "Volumen Plaquetario Medio (MPV)",
  "Indice de Distribución Plaquetaria (PDWc)",
  "Glóbulos Blancos",
  "Linfocitos (%)",
  "Neutrófilos (%)",
  "Monocitos (%)",
  "Eosinófilos (%)",
  "Basófilos (%)",
  "Linfocitos (#)",
  "Neutrófilos (#)",
  "Monocitos (#)",
  "Eosinófilos (#)",
  "Basófilos (#)",
  "P_LCR",
  "P_LCC",
  "LIC (#)",
  "Glucosa",
  "Urea",
  "Creatinina",
  "Ácido Úrico",
  "Proteínas Totales",
  "Albúmina",
  "Globulina",
  "Índice A/G",
  "Colesterol",
  "Triglicéridos",
  "Colesterol HDL",
  "Colesterol LDL Calculado",
  "Colesterol VLDL",
  "Apolipoproteína B",
  "Lipoproteina (a)",
  "Bilirrubina Total",
  "Bilirrubina Directa",
  "Bilirrubina Indirecta",
  "Transaminasa Oxalacetica TGO",
  "Transaminasa Pirúvica TGP",
  "Calcio",
  "Fósforo",
  "Nivel de Nitrógeno Uréico",
  "Hemoglobina Glicada HbA1c",
  "VDRL Cualitativo",
  "Sodio",
  "Potasio",
  "Cloro"
];
const urine=[
  "Color",
  "Aspecto",
  "Densidad",
  "pH",
  "Esterasa leucocitaria",
  "Nitritos",
  "Proteínas",
  "Glucosa",
  "Cuerpos Cetónicos",
  "Urobilinógeno",
  "Bilirrubina",
  "Hemoglobina",
  "Leucocitos",
  "Hematíes",
  "Células Epiteliales Escamosas",
  "Células Escamosas No Epiteliales",
  "Mucina",
  "Bacterias"
];
const line=(name,value="1.00",unit="mg/dL")=>name+"\t"+value+"\t"+unit+"\t0 - 999";
const section=(header,items)=>[header,...items];
test("four-section source report reconciles all 72 original labels with specimen isolation",()=>{
 const lines=[
  ...section("HEMATOLOGÍA",blood.slice(0,26).map(n=>line(n))),
  ...section("BIOQUÍMICA",blood.slice(26,50).map(n=>line(n))),
  "Colesterol HDL\t1.00\tmg/dL\tBajo: <55",
  "Bajo: < 55","Moderado: 35 - 55","Alto: > 35",
  ...section("SEROLOGÍA",[line(blood[50],"No reactivo","")]),
  "UROANÁLISIS","EXAMEN DE ORINA","EXAMEN FÍSICO - QUÍMICO",
  ...urine.map((n,i)=>line(n,
    i===0?"Amarillo":i===1?"Limpido":i===4||i===5||i===6||i===7||i===8||i===10||i===11?"Negativo":i===9?"Normal":i===16?"Escasa":i===17?"Escasas":"1.00",
    i>=12&&i<=15?"/µL":"")),
  "EXAMEN MICROSCOPICO",
  ...section("ELECTROLITOS",blood.slice(51).map(n=>line(n,"1.00","mmol/L"))),
  "Método: Fotometría Automatizada","Resultados","Página 1","Total: 72"
 ];
 // HDL is already in the 24 bioquímica labels, so its reference line above must not
 // introduce a second measurement; the explicit duplicate here is omitted below.
 const withoutSyntheticDuplicate=lines.filter((line,i)=>!(line.startsWith("Colesterol HDL\t")&&i!==lines.findIndex(v=>v.startsWith("Colesterol HDL\t"))));
 const review=analyzeExtractedText(withoutSyntheticDuplicate.join("\n"),catalog,80);
 assert.equal(blood.length,54);
 assert.equal(urine.length,18);
 assert.equal(review.rows.length,72);
 assert.deepEqual(review.rows.filter(r=>r.specimen==="urine").map(r=>r.original),urine);
 assert.equal(review.rows.filter(r=>r.specimen==="blood").length,54);
 assert.equal(review.rows.filter(r=>r.specimen==="urine"&&r.indicatorCode).length,0);
 assert.equal(review.rows.filter(r=>/^(bajo|moderado|alto|total)/i.test(r.original)).length,0);
 assert.equal(review.rows.find(r=>r.original==="VDRL Cualitativo")?.value,"No reactivo");
 assert.equal(review.rows.find(r=>r.specimen==="urine"&&r.original==="Glucosa")?.status,"review");
});
test("source section transition is explicit across serology, urine and electrolytes",()=>{
 const r=analyzeExtractedText([
   "SEROLOGÍA",line("VDRL Cualitativo","No reactivo",""),
   "UROANÁLISIS",line("Glucosa","Negativo",""),
   "ELECTROLITOS",line("Sodio","1.00","mmol/L")
 ].join("\n"),catalog);
 assert.deepEqual(r.rows.map(x=>x.specimen),["blood","urine","blood"]);
 assert.deepEqual(r.rows.map(x=>x.section),["Serología","Uroanálisis","Electrolitos"]);
});
