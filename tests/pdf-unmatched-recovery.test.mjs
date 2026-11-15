import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const importer=readFileSync("src/app/(dashboard)/mi-analisis/importar-pdf/page.tsx","utf8");
const inbox=readFileSync("src/app/(dashboard)/mi-analisis/pendientes/page.tsx","utf8");
const migration=readFileSync("supabase/migrations/202611150002_lab_unmatched_readings_v2.sql","utf8");
test("unmapped, qualitative and complementary readings are distinct",()=>{
 assert.match(importer,/unmapped.*qualitative.*complementary/);
 assert.match(importer,/total de celularidad/);
 assert.match(importer,/proteina c reactiva/);
 assert.match(importer,/save_lab_review_v2/);
});
test("numeric and pending rows saved together without fabricating catalog observations",()=>{
 assert.match(importer,/rows\.map\(r=>\(\{decision:r\.decision/);
 assert.match(migration,/lab_unmatched_readings/);
 assert.match(migration,/on conflict\(user_id,document_sha256,collected_on,source_row\) do nothing/);
 assert.match(migration,/on conflict \(user_id,origin,source_key\) where source_key is not null do nothing/);
});
test("pending data is owner-private and inbox has auth checks",()=>{
 assert.match(migration,/enable row level security/);
 assert.match(migration,/using \(\(select auth.uid\(\)\)=user_id\)/);
 assert.match(inbox,/db.auth.getUser\(\)/);
 assert.match(inbox,/\.eq\("user_id",user\.id\)/);
});
test("public repository migration never contains medical result literals",()=>{
 assert.doesNotMatch(migration,/35,30|284\.000|Negativo, < 6|93 mg\/dL/);
});
