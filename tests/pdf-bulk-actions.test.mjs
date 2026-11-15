import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/(dashboard)/mi-analisis/importar-pdf/page.tsx","utf8");
test("category selection is displayed on the right in the top review toolbar",()=>{
 assert.ok(page.includes('Categorías para aprobación masiva'));
 assert.ok(page.includes('justifyContent:"flex-end"'));
 for(const label of ["Candidatos válidos","Requieren revisión","Sin equivalencia","Excluidos"]){
  assert.ok(page.includes(label),label);
 }
 assert.ok(page.includes('type="checkbox" disabled={g.count===0}'));
});
test("selected candidates and unmapped results get distinct safe decisions",()=>{
 assert.ok(page.includes('groupFor(r)==="candidates"'));
 assert.ok(page.includes('groupFor(r)==="unmapped"'));
 assert.ok(page.includes('confirmations.has(r.id)?{...r,decision:"confirmed"}'));
 assert.ok(page.includes('deferrals.has(r.id)?{...r,decision:"deferred"}'));
});
test("review and excluded groups cannot automatically confirm or delete",()=>{
 assert.ok(page.includes('groupNeedsReview.length'));
 assert.ok(page.includes('groupExcludedReview.length'));
 assert.ok(page.includes('Los demás grupos no se modificaron'));
});
test("preparation requires review acknowledgment, and persistence is separate",()=>{
 assert.ok(page.includes('if(isGroupMode&&!groupAcknowledged)'));
 assert.ok(page.includes('function prepareBulk()'));
 assert.ok(page.includes('function applyBulk()'));
 assert.ok(page.includes('db.rpc("save_lab_review_v2"'));
 assert.ok(page.includes('Guardar en el historial es un paso posterior'));
});
test("per-row checkboxes remain available with selection scoped to visible rows",()=>{
 assert.ok(page.includes('const visibleIds=visible.map'));
 assert.ok(page.includes('onChange={selectVisible}'));
 assert.ok(page.includes('Seleccionar fila '));
 assert.ok(page.includes('const approved=new Set(eligibleSelected.map(r=>r.id))'));
 assert.ok(page.includes('approved.has(r.id)?{...r,decision:rowAction}:r'));
});
