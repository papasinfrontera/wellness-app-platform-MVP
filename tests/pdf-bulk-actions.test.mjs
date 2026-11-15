import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/(dashboard)/mi-analisis/importar-pdf/page.tsx","utf8");
test("bulk selection limited to visible filtered row IDs",()=>{
 assert.match(page,/const visibleIds=visible\.map/);
 assert.match(page,/const allVisibleSelected=/);
 assert.match(page,/onChange=\{selectVisible\}/);
 assert.match(page,/Seleccionar fila/);
});
test("confirm is restricted to valid candidates pending review",()=>{
 assert.match(page,/r\.decision==="pending"&&\(bulkAction!=="confirmed"\|\|valid\(r\)&&r\.status==="candidate"\)/);
});
test("bulk preparation and confirmation are separate; writes only in final step",()=>{
 assert.match(page,/function prepareBulk\(\)/);
 assert.match(page,/function applyBulk\(\)/);
 assert.match(page,/bulkPreview\|\|eligibleSelected\.length===0/);
 assert.match(page,/Ninguna medición se ha guardado en Supabase/);
 assert.match(page,/db\.rpc\("save_lab_review_v2"/);
});
test("exclusion is scoped to explicitly selected rows",()=>{
 assert.match(page,/const approved=new Set\(eligibleSelected\.map\(r=>r\.id\)\)/);
 assert.match(page,/approved\.has\(r\.id\)\?\{\.\.\.r,decision:bulkAction\}:r/);
});
