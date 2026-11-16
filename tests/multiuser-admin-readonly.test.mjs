import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const route=readFileSync("src/app/api/admin/users/route.ts","utf8");
const page=readFileSync("src/app/admin/usuarios/page.tsx","utf8");
const admin=readFileSync("src/app/admin/page.tsx","utf8");
test("privileged auth management stays exclusively on the server",()=>{
 assert.match(route,/export async function GET/);
 assert.match(route,/process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
 assert.doesNotMatch(page,/SERVICE_ROLE_KEY/);
 assert.match(route,/admin\.listUsers/);
 assert.match(route,/claims\.aal!=="aal2"/);
 assert.match(route,/getClaims\(match\[1\]\)/);
 assert.match(route,/auth\.getUser\(match\[1\]\)/);
});
test("superadministrator authorization enforced after token verification",()=>{
 assert.match(route,/eq\("user_id",userData\.user\.id\)/);
 assert.match(route,/role!=="super_admin"/);
 assert.match(route,/adminRole\.is_active!==true/);
 assert.match(route,/return denied\(403\)/);
 assert.match(admin,/name==="Usuarios"&&role==="super_admin"/);
});
test("directory returns only account metadata with no clinical or profile data",()=>{
 assert.match(route,/email_confirmed:/);
 assert.match(route,/last_sign_in_at:/);
 assert.match(route,/admin_role:/);
 assert.doesNotMatch(route,/from\("observations"\)/);
 assert.doesNotMatch(route,/from\("wellness_profiles"\)/);
 assert.doesNotMatch(route,/from\("documents"\)/);
 assert.doesNotMatch(route,/auth\.admin\.updateUserById/);
 assert.doesNotMatch(route,/auth\.admin\.deleteUser/);
 assert.match(route,/no-store/);
});
test("UI paginates and communicates restrictions accurately",()=>{
 assert.match(page,/Página \{page\}/);
 assert.match(page,/Buscar en esta página/);
 assert.match(page,/roles/);
 assert.match(page,/solo lectura/);
 assert.match(page,/role/);
 assert.match(page,/status==="mfa"/);
 assert.match(page,/status==="denied"/);
 assert.match(page,/credentials:"same-origin"/);
});
