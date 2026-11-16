import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {reconstructPdfRows} from "../src/lib/pdf-layout-reconstruction.ts";
import {analyzeExtractedText} from "../src/lib/pdf-lab-review.ts";
const catalog=JSON.parse(readFileSync("src/app/(dashboard)/mi-analisis/catalog-reference.json","utf8"));
const item=(str,x,y,width=25)=>({str,transform:[1,0,0,1,x,y],width});
test("CHCM split over two lines and centered numeric value reconstructs one test",()=>{
 const items=[
  item("(CHCM)",66,272,30),
  item("31 g/dL",246,277,35),
  item("32-36 g/dL",342,277,45),
  item("6",38,277,5),
  item("Hematología",488,277,55),
  item("Concentración de Hb corpuscular media",66,282,160),
  item("7",38,306,5),
  item("Ancho de distribución eritrocitaria (RDWc)",66,306,170),
  item("12,3 %",246,306,30),
  item("11-16 %",342,306,30)
 ];
 // PDF's Y-axis points up; wrapped text is 5.5 pts above/below anchor.
 // Here the top of the two lines is at 282.
 const raw=reconstructPdfRows(items);
 const parsed=analyzeExtractedText(raw,catalog);
 assert.equal(parsed.rows.length,2,raw);
 assert.match(parsed.rows[0].original,/Concentración de Hb corpuscular media \(CHCM\)/);
 assert.equal(parsed.rows[0].unit,"g/dL");
 assert.equal(parsed.rows[0].value,"31");
 assert.equal(parsed.rows[0].indicatorCode,"REF-009");
 assert.equal(parsed.rows[1].original,"Ancho de distribución eritrocitaria (RDWc)");
});
test("a distant or a real separate numbered test is not incorrectly merged",()=>{
 const items=[
  item("6",38,100),item("Concentración de Hb corpuscular media",66,100,161),
  item("31 g/dL",246,100,39),
  item("Extra label",66,118,45),
  item("7",38,123),item("Hemoglobina",66,123,80),item("15,4 g/dL",246,123,44)
 ];
 const raw=reconstructPdfRows(items);
 const r=analyzeExtractedText(raw,catalog);
 assert.equal(r.rows.length,2,raw);
 assert.equal(r.rows[1].original,"Hemoglobina");
});
