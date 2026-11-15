import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const importer=readFileSync("src/app/(dashboard)/mi-analisis/importar-pdf/page.tsx","utf8");
const history=readFileSync("src/app/(dashboard)/mi-analisis/archivos/page.tsx","utf8");
const sql=readFileSync("supabase/migrations/202611150003_lab_import_manifest_v3.sql","utf8");
test("metadata is saved with the same review transaction",()=>{
 assert.ok(importer.includes('db.rpc("save_lab_review_v3"'));
 assert.ok(importer.includes("p_filename:file.name"));
 assert.ok(importer.includes("p_lab_name:laboratoryName.trim()||null"));
 assert.ok(sql.includes("public.save_lab_review_v2(p_rows,p_observed_on,p_sha256)"));
 assert.ok(sql.includes("insert into public.lab_import_manifest"));
});
test("metadata-only provenance protects patient information",()=>{
 assert.ok(sql.includes("enable row level security"));
 assert.ok(sql.includes("auth.uid()"));
 assert.ok(sql.includes("security invoker"));
 assert.ok(sql.includes("unique (user_id, sha256, sample_date)")||sql.includes("unique(user_id,sha256,sample_date)"));
 assert.ok(history.includes("PDF original no se almacena"));
 assert.ok(!sql.includes("104,5 mg/dL"));
});
test("documents list is authenticated and legacy files are explicitly unknown",()=>{
 assert.ok(history.includes("db.auth.getUser()"));
 assert.ok(history.includes('.eq("user_id",user.id)'));
 assert.ok(history.includes("Archivo anterior no registrado"));
 assert.ok(history.includes("No se inventan datos faltantes"));
});
