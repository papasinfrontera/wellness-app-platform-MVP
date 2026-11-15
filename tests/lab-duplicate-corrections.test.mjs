import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyLabCorrections,latestCorrections} from "../src/lib/lab-corrections.ts";

const page=readFileSync("src/app/(dashboard)/mi-analisis/correcciones/page.tsx","utf8");
const importer=readFileSync("src/app/(dashboard)/mi-analisis/importar-pdf/page.tsx","utf8");
const detail=readFileSync("src/app/(dashboard)/mi-analisis/[id]/page.tsx","utf8");
const analysis=readFileSync("src/app/(dashboard)/mi-analisis/page.tsx","utf8");
const migration=readFileSync("supabase/migrations/202611150004_lab_observation_corrections.sql","utf8");
const guard=readFileSync("supabase/migrations/202611150005_lab_same_day_duplicate_guard.sql","utf8");

test("corrections are append-only overlays; originals remain unchanged",()=>{
 const originals=[{id:"obs-a",value:95,unit:"mg/dL"},{id:"obs-b",value:12,unit:"U/L"}];
 const events=[
  {id:"c1",observation_id:"obs-a",corrected_value:96,corrected_unit:"mg/dL",reason:"Verified against source",created_at:"2026-01-01T10:00:00Z"},
  {id:"c2",observation_id:"obs-a",corrected_value:97,corrected_unit:"mg/dL",reason:"Second verified change",created_at:"2026-01-02T10:00:00Z"}
 ];
 const current=applyLabCorrections(originals,events);
 assert.equal(current[0].value,97);
 assert.equal(current[0].originalValue,95);
 assert.equal(current[0].corrected,true);
 assert.equal(current[1].corrected,false);
 assert.deepEqual(originals[0],{id:"obs-a",value:95,unit:"mg/dL"});
 assert.equal(latestCorrections(events).get("obs-a")?.id,"c2");
});
test("corrections scoped by RLS to owner and verified laboratory observations",()=>{
 assert.match(migration,/enable row level security/);
 assert.match(migration,/\(select auth\.uid\(\)\)=user_id/);
 assert.match(migration,/o\.id=observation_id and o\.user_id=\(select auth\.uid\(\)\)/);
 assert.match(migration,/o\.origin='laboratory' and o\.status='approved'/);
 assert.match(migration,/grant select,insert/);
 assert.doesNotMatch(migration,/grant (?:update|delete)/i);
});
test("correction requires reason and preserves original in user interface",()=>{
 assert.match(page,/reason\.trim\(\)\.length<10/);
 assert.match(page,/originalValue/);
 assert.match(page,/lab_observation_corrections"\)\.insert/);
 assert.match(page,/Versiones anteriores/);
 assert.match(analysis,/applyLabCorrections\(found/);
 assert.match(detail,/applyLabCorrections\(measured/);
});
test("new same-day duplicate guard is transactional and rejects different source",()=>{
 assert.match(guard,/create trigger trg_block_lab_same_day_duplicate before insert/);
 assert.match(guard,/pg_advisory_xact_lock/);
 assert.match(guard,/source_key is distinct from new\.source_key/);
 assert.match(guard,/POTENTIAL_DUPLICATE_SAME_DAY/);
 assert.match(importer,/duplicateMatches\.length>0/);
 assert.match(importer,/No se sobrescribirán resultados automáticamente/);
 assert.match(importer,/duplicateCheck!=="ready"/);
});
