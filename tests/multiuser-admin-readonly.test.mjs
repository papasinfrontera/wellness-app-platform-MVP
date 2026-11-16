import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const route=readFileSync("src/app/api/admin/users/route.ts","utf8");
const authorization=readFileSync("src/lib/admin/authorization.ts","utf8");
const page=readFileSync("src/app/admin/usuarios/page.tsx","utf8");
const admin=readFileSync("src/app/admin/page.tsx","utf8");
test("privileged auth management stays exclusively on the server",()=>{
 assert.match(route,/export async function GET/);
 assert.match(authorization,/process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
 assert.doesNotMatch(page,/SERVICE_ROLE_KEY/);
 assert.match(route,/admin\.listUsers/);
 assert.match(authorization,/claims\.claims\.aal!=="aal2"/);
 assert.match(authorization,/getClaims\(token\)/);
 assert.match(authorization,/auth\.getUser\(token\)/);
});
test("superadministrator authorization enforced after token verification",()=>{
 assert.match(authorization,/eq\("user_id",user\.user\.id\)/);
 assert.match(authorization,/role\?\.role!=="super_admin"/);
 assert.match(authorization,/role\.is_active!==true/);
 assert.match(route,/verifySuperadmin\(request\)/);
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
 assert.match(authorization,/no-store/);
});
test("UI paginates and communicates restrictions accurately",()=>{
 assert.match(page,/Página \{page\}/);
 assert.match(page,/Buscar en esta página/);
 assert.match(page,/roles/);
 assert.match(page,/Confirma|Confirmación/);
 assert.match(page,/role/);
 assert.match(page,/status==="mfa"/);
 assert.match(page,/status==="denied"/);
 assert.match(page,/credentials:"same-origin"/);
});
