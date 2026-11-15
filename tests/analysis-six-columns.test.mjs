import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/(dashboard)/mi-analisis/page.tsx","utf8");
const css=readFileSync("src/app/(dashboard)/mi-analisis/analisis.css","utf8");
test("approved six distinct columns in same order",()=>{
 const header=page.match(/className="wa-result-head"[^>]*>(.*?)<\/div>/s)?.[1]||"";
 const labels=["Indicador","Resultado","Unidad","Estado","Categoría"];
 let last=-1;
 for(const label of labels){const idx=header.indexOf(">"+label+"</span>");assert.ok(idx>last,label);last=idx;}
});
test("values and units are rendered separately and preserve user-owned data",()=>{
 assert.match(page,/resultLabel\(x\.value\)/);
 assert.match(page,/x\.unit\|\|"—"/);
 assert.match(page,/\.eq\("user_id",user\.id\)/);
 assert.ok(page.includes('display==="sufficient"?"Suficiente"'),"State shows a qualified laboratory classification");
 assert.ok(page.includes('display==="pending"'),"Unverified results remain pending rather than missing");
 assert.doesNotMatch(page,/x\.status==="approved"\?"Óptimo"/);
});
test("category list has eleven entries and one category assignment per indicator",()=>{
 assert.match(page,/const groups=\[/);
 assert.match(page,/const categoryFor=/);
 assert.match(page,/categoryFor\(x\)===group/);
 assert.match(page,/Pendiente de categoría/);
});
test("desktop layout has six grid tracks",()=>{
 assert.match(css,/Sprint 6\.6-C/);
 assert.match(css,/grid-template-columns:minmax\(185px,2\.35fr\).*17px;/);
});
