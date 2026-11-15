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

test("regression: 22 rows in a five-column laboratory report, no personal identifiers",()=>{
 const table=[
 ["Hemoglobina","13,9 g/dL","12–17 g/dL"],
 ["Hematocrito","42,10 %","40–52 %"],
 ["Glóbulos rojos","5,01 × 10⁶/µL","3–6 × 10⁶/µL"],
 ["VCM","85,4 fL","80–100 fL"],
 ["HCM","28,1 pg","27–34 pg"],
 ["CHCM","33,2 g/dL","31–36 g/dL"],
 ["Glóbulos blancos","7.800/µL","5.000–10.000/µL"],
 ["Neutrófilos","65 %","No indicado"],
 ["Linfocitos","30 %","No indicado"],
 ["Monocitos","5 %","No indicado"],
 ["Total de celularidad","100 %","No indicado"],
 ["Plaquetas","250.000/µL","140.000–440.000/µL"],
 ["Volumen plaquetario medio","9,5 fL","6,50–12 fL"],
 ["Glicemia basal","90 mg/dL","65–110 mg/dL"],
 ["Urea","30,30 mg/dL","15–40 mg/dL"],
 ["Creatinina","1,10 mg/dL","0,70–1,20 mg/dL"],
 ["Fosfatasa alcalina","75,60 U/L","27–100 U/L"],
 ["Proteínas totales","7,00 g/dL","6–8 g/dL"],
 ["Albúmina","4,00 g/dL","3,50–5 g/dL"],
 ["Globulina","3,00 g/dL","No indicado"],
 ["Relación albúmina/globulina","1,33","1,20–2,20"],
 ["Proteína C reactiva (PCR)","Negativo, < 6 mg/L","Negativo: < 6,0 mg/L"]
 ];
 const report=table.map(([name,value,ref],i)=>String(i+1)+"\t"+name+"\t"+value+"\t"+ref+"\tHematología").join("\n");
 const result=analyzeExtractedText(report,catalog);
 assert.equal(result.rows.length,22);
 assert.equal(result.rows[0].original,"Hemoglobina");
 assert.equal(result.rows[0].value,"13,9");
 assert.equal(result.rows[0].unit,"g/dL");
 assert.equal(result.rows[2].unit,"× 10⁶/µL");
 assert.equal(result.rows[6].value,"7.800");
 assert.equal(result.rows[6].unit,"/µL");
 assert.equal(result.rows[11].value,"250.000");
 assert.equal(result.rows[14].indicatorCode,"");
 assert.equal(result.rows[14].status,"review"); // Urea is not necessarily BUN
 assert.equal(result.rows[20].value,"1,33");
 assert.equal(result.rows[20].status,"candidate"); // Dimensionless A/G ratio with exact identity; still needs user confirmation
 assert.match(result.rows[21].value,/Negativo/);
 assert.equal(result.rows[21].status,"review"); // Non-hs CRP != high-sensitivity CRP
 assert.ok(result.rows.every(x=>!x.raw.includes("Nombre:")));
});
test("regression: plain-space columns do not replace measured value with a reference interval",()=>{
 const r=analyzeExtractedText("1  Hemoglobina                   14,7 g/dL            12–17 g/dL             Hematología\n2  Creatinina                    1,17 mg/dL          0,70–1,20 mg/dL     Bioquímica",catalog);
 assert.equal(r.rows.length,2);
 assert.equal(r.rows[0].value,"14,7");
 assert.equal(r.rows[1].value,"1,17");
});
test("regression: standard CRP must not be mapped to high sensitivity CRP",()=>{
 const r=analyzeExtractedText("22\tProteína C reactiva (PCR)\tNegativo, < 6 mg/L\tNegativo: < 6,0 mg/L\tSerología",catalog);
 assert.equal(r.rows.length,1);
 assert.equal(r.rows[0].status,"review");
 assert.notEqual(r.rows[0].indicatorCode,"REF-020");
});


test("PDF layout renderer emits real newlines and tab separators, not literal slash escapes",()=>{
 const route=readFileSync("src/app/api/lab-pdf-preview/route.ts","utf8");
 assert.ok(route.includes('output+="\\n"'.replace("\\\\n","\\n")));
 assert.ok(route.includes('?"\\t":" "'.replace("\\\\t","\\t")));
 assert.ok(!route.includes('output+="\\\\n"'));
 assert.ok(!route.includes('?"\\\\t":" "'));
});


test("A.2 candidate mapping helps without auto-approval",()=>{
 for(const [label,unit,code] of [["Volumen plaquetario medio","fL","REF-046"],["Glicemia basal","mg/dL","REF-017"]]){
  const p=identifyPdfIndicator(label,unit,catalog);
  assert.equal(p.code,code);
  assert.equal(p.status,"review");
 }
});
test("A.2 dimensionless albumin globulin ratio recognized as a review candidate",()=>{
 const p=identifyPdfIndicator("Relación albúmina/globulina","",catalog);
 assert.equal(p.code,"REF-028");
 assert.equal(p.status,"candidate");
});
test("A.2 never assigns Urea to BUN or generic CRP to hs-CRP",()=>{
 for(const [label,unit,wrong] of [["Urea","mg/dL","REF-004"],["Proteína C reactiva (PCR)","mg/L","REF-020"]]){
 const p=identifyPdfIndicator(label,unit,catalog);
 assert.notEqual(p.code,wrong);assert.equal(p.status,"review");
 }
});
test("A.2 interface has finalization and explicit pending classification with no DB writes",()=>{
 const page=readFileSync("src/app/(dashboard)/mi-analisis/importar-pdf/page.tsx","utf8");
 assert.match(page,/Finalizar revisión/);assert.match(page,/Pendiente/);assert.match(page,/Volver a editar/);
 for(const op of ['.insert(','.upsert(','.update(','.delete('])assert.ok(!page.includes(op),"No direct client write: "+op);
});


test("6.8-D report counts are metadata while total cellularity is a complementary reading",()=>{
 const report=[
 "23\tTransaminasa oxalacética (TGO/AST)\t18,20 U/L\t10–40 U/L",
 "24\tTransaminasa pirúvica (TGP/ALT)\t24,20 U/L\t7–56 U/L",
 "25\tTotal:\t24",
 "Total: 24",
 "11\tTotal de celularidad\t100 %\tNo indicado"
 ].join("\n");
 const parsed=analyzeExtractedText(report,catalog);
 assert.equal(parsed.rows.length,3);
 assert.equal(parsed.rows[0].indicatorCode,"REF-030");
 assert.equal(parsed.rows[1].indicatorCode,"REF-026");
 assert.equal(parsed.rows[0].status,"review");
 assert.equal(parsed.rows[1].status,"review");
 assert.equal(parsed.rows[2].original,"Total de celularidad");
});
test("6.8-D non-equivalent readings stay unmapped rather than silently discarded",()=>{
 const parsed=analyzeExtractedText(["15\tUrea\t31,20 mg/dL","22\tColesterol VLDL\t42,20 mg/dL"].join("\n"),catalog);
 assert.equal(parsed.rows.length,2);
 assert.ok(parsed.rows.every(r=>r.status==="review"));
 assert.ok(parsed.rows.every(r=>r.indicatorCode===""));
});
