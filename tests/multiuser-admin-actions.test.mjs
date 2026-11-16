import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const route=readFileSync("src/app/api/admin/users/actions/route.ts","utf8");
const auth=readFileSync("src/lib/admin/authorization.ts","utf8");
const directory=readFileSync("src/app/admin/usuarios/page.tsx","utf8");
const listings=readFileSync("src/app/api/admin/users/route.ts","utf8");
test("admin writes are server-only and require MFA plus current superadmin role",()=>{
 assert.match(auth,/auth\.getUser\(token\)/);
 assert.match(auth,/auth\.getClaims\(token\)/);
 assert.match(auth,/claims\.claims\.aal!=="aal2"/);
 assert.match(auth,/role\?\.role!=="super_admin"/);
 assert.match(route,/verifySuperadmin\(request\)/);
 assert.match(route,/isHttpError\(auth\)/);
 assert.doesNotMatch(directory,/SUPABASE_SERVICE_ROLE_KEY/);
});
test("administrative invitations require explicit email confirmation and an audit intent",()=>{
 assert.match(route,/confirmed!==email/);
 assert.match(route,/user_invite_requested/);
 assert.match(route,/inviteUserByEmail\(email\)/);
 assert.match(route,/user_invite_sent/);
 assert.doesNotMatch(route,/createUser\(/);
});
test("role changes cannot assign superadmin or modify protected accounts",()=>{
 assert.match(auth,/roleChoices=\["operations_admin","scientific_admin","support_admin"\]/);
 assert.match(route,/target===auth\.actorId/);
 assert.match(route,/targetRole\?\.role==="super_admin"/);
 assert.match(route,/targetUser\.user/);
 assert.match(route,/role!==null/);
 assert.match(route,/user_role_requested/);
 assert.match(route,/user_role_completed/);
});
test("suspension discloses JWT limitations and confirmation",()=>{
 assert.match(route,/ban_duration:duration/);
 assert.match(route,/user_"\+action\+"_requested"/);
 assert.match(directory,/los tokens activos podrían continuar válidos/);
 assert.match(directory,/reason\.trim\(\)\.length<12/);
 assert.match(listings,/banned_until:u\.banned_until/);
});
test("user directory has no clinical data access and privileged action API is write-only",()=>{
 assert.match(route,/export async function POST/);
 assert.doesNotMatch(route,/from\("observations"\)/);
 assert.doesNotMatch(route,/from\("wellness_profiles"\)/);
 assert.match(auth,/private, no-store/);
 assert.match(directory,/confirmación|Confirmación/i);
});
