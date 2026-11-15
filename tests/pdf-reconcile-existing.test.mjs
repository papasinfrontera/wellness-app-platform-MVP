import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync("src/app/(dashboard)/mi-analisis/importar-pdf/page.tsx","utf8");
test("recovery requires authenticated user and exact file fingerprint",()=>{
 assert.match(source,/identity!=="signed_in"/);
 assert.match(source,/crypto\.subtle\.digest\("SHA-256"/);
 assert.match(source,/\.eq\("user_id",user\.id\)/);
 assert.match(source,/\.like\("source_key",sha\+":%"\)/);
});
test("matching also verifies indicator identity, numeric value, unit, original label",()=>{
 assert.match(source,/indicators\?\.code===row\.indicatorCode/);
 assert.match(source,/Number\(saved\.value\)===numeric/);
 assert.match(source,/normalizeUnit\(saved\.unit\)===normalizeUnit\(row\.unit\)/);
 assert.match(source,/normalize\(saved\.raw_label\|\|""\)===normalize\(row\.original\)/);
});
test("prior approval is optional and does not automatically save",()=>{
 assert.match(source,/function applyPriorReview\(\)/);
 assert.match(source,/onClick=\{applyPriorReview\}/);
 assert.match(source,/setCollectionDate\(recognizedDate\)/);
 assert.match(source,/ids\.has\(r\.id\)\?"confirmed"/);
 assert.match(source,/\?"deferred"/);
 assert.doesNotMatch(source,/await saveReviewed\(\)/);
});
