import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {analyzeExtractedText} from "../src/lib/pdf-lab-review.ts";
const catalog=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
// Labels and unit patterns follow the 26 rows of the user-provided hematology
// report. Numeric values are synthetic; no patient data is committed publicly.
const source=[
 ["Recuento de glóbulos rojos","10^6/µL"],
 ["Hemoglobina","g/dL"],
 ["Hematocrito","%"],
 ["Volumen corpuscular medio (VCM)","µm³"],
 ["Hemoglobina corpuscular media (HCM)","pg"],
 ["Concentración de Hb corpuscular media (CHCM)","g/dL"],
 ["Ancho de distribución eritrocitaria (RDWc)","%"],
 ["Ancho de distribución eritrocitaria (RDWs)","µm³"],
 ["Plaquetas","10³/µL"],
 ["Plaquetocrito","%"],
 ["Volumen plaquetario medio (MPV)","µm³"],
 ["Índice de distribución plaquetaria (PDWc)","%"],
 ["Glóbulos blancos","10³/µL"],
 ["Linfocitos (%)","%"],
 ["Neutrófilos (%)","%"],
 ["Monocitos (%)","%"],
 ["Eosinófilos (%)","%"],
 ["Basófilos (%)","%"],
 ["Linfocitos (#)","10³/µL"],
 ["Neutrófilos (#)","10³/µL"],
 ["Monocitos (#)","10³/µL"],
 ["Eosinófilos (#)","10³/µL"],
 ["Basófilos (#)","10³/µL"],
 ["P_LCR","%"],
 ["P_LCC","10³/µL"],
 ["LIC (#)","10⁹/µL"]
];
const pending=new Set(["Ancho de distribución eritrocitaria (RDWs)","Plaquetocrito","Índice de distribución plaquetaria (PDWc)","P_LCR","P_LCC","LIC (#)"]);
test("reconcile 26 original hematology labels with specimen and unit preserved",()=>{
 const synthetic=source.map(([name,unit])=>name+"\t1.00\t"+unit+"\tSin referencia");
 const result=analyzeExtractedText(["Reporte de hematología",...synthetic,"Total: 26"].join("\n"),catalog);
 assert.equal(source.length,26);
 assert.equal(result.rows.length,26);
 assert.deepEqual(result.rows.map(r=>r.original),source.map(x=>x[0]));
 assert.deepEqual(result.rows.map(r=>r.unit),source.map(x=>x[1]));
 assert.ok(result.rows.every(r=>r.specimen==="blood"&&r.section==="Hematología"));
 assert.equal(result.rows.filter(r=>r.status==="candidate").length,14);
 assert.equal(result.rows.filter(r=>r.indicatorCode&&r.status==="review").length,6);
 assert.equal(result.rows.filter(r=>!r.indicatorCode).length,6);
});
test("six unmapped hematology labels have specific non-approvable review explanations",()=>{
 for(const [name,unit] of source.filter(x=>pending.has(x[0]))){
  const row=analyzeExtractedText("HEMATOLOGÍA\n"+name+"\t1.00\t"+unit,catalog).rows[0];
  assert.equal(row?.status,"review",name);
  assert.equal(row?.indicatorCode,"",name);
  assert.ok(row?.reason.length>65,name);
 }
});
test("absolute and relative cell measurements always remain separate",()=>{
 const rows=analyzeExtractedText([
 "HEMATOLOGÍA",
 "Linfocitos (%)\t30.00\t%",
 "Linfocitos (#)\t2.00\t10³/µL",
 "RDWs\t40.00\tµm³"
 ].join("\n"),catalog).rows;
 assert.equal(rows.length,3);
 assert.equal(rows[0].indicatorCode,"REF-043");
 assert.equal(rows[1].indicatorCode,"REF-044");
 assert.equal(rows[1].status,"review");
 assert.equal(rows[2].indicatorCode,"");
});
