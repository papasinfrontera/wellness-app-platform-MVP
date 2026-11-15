import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/(dashboard)/mi-analisis/page.tsx","utf8");
const migration=readFileSync("supabase/migrations/202611150001_observation_reference_intervals.sql","utf8");
test("intervals join the user's authenticated observations only",()=>{
 assert.ok(page.includes('db.from("observation_reference_intervals")'));
 assert.ok(page.includes('.eq("user_id",user.id)'));
 assert.ok(page.includes('refMap.get(x.id)'));
});
test("source intervals remain separate from unapproved clinical labels",()=>{
 assert.ok(page.includes('source_kind!=="user_supplied_pdf"'));
 assert.ok(page.includes('pdfReference.lower_bound'));
 assert.ok(page.includes('Pendiente de evaluación'));
 assert.ok(page.includes('La etiqueta «Suficiente» en este piloto'));
});
test("database references have owner RLS and no client write permission",()=>{
 assert.match(migration,/enable row level security/);
 assert.match(migration,/revoke all on public.observation_reference_intervals from anon, authenticated/);
 assert.match(migration,/grant select on public.observation_reference_intervals to authenticated/);
 assert.doesNotMatch(migration,/grant (insert|update|delete)/i);
});
