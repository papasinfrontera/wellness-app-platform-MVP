import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const auth=readFileSync("src/lib/admin/authorization.ts","utf8");
const directory=readFileSync("src/app/api/admin/users/route.ts","utf8");
const operations=readFileSync("src/app/api/admin/users/actions/route.ts","utf8");
const sql=readFileSync("supabase/migrations/202611160001_admin_session_is_active.sql","utf8");

test("revoked, expired and banned sessions are rejected for admin reads and writes",()=>{
 assert.match(auth,/sessionId=claims\.claims\.session_id/);
 assert.match(auth,/operator\.rpc\("admin_session_is_active"/);
 assert.match(auth,/if\(sessionActive!==true\)/);
 assert.match(auth,/sessionError/);
 assert.match(auth,/claims\.claims\.aal!=="aal2"/);
 assert.match(directory,/verifySuperadmin\(request\)/);
 assert.match(operations,/verifySuperadmin\(request\)/);
});
test("only a privileged server can query the active session helper",()=>{
 assert.match(sql,/security definer/);
 assert.match(sql,/set search_path = ''/);
 assert.match(sql,/from auth\.sessions s/);
 assert.match(sql,/join auth\.users u/);
 assert.match(sql,/s\.id = p_session_id and s\.user_id = p_user_id/);
 assert.match(sql,/u\.banned_until is null or u\.banned_until <= now\(\)/);
 assert.match(sql,/revoke all on function public\.admin_session_is_active\(uuid, uuid\) from public, anon, authenticated/);
 assert.match(sql,/grant execute on function public\.admin_session_is_active\(uuid, uuid\) to service_role/);
});
test("a revoked session never falls through on RPC failure",()=>{
 assert.match(auth,/if\(sessionError\)return reply\(\{error:"No fue posible comprobar la vigencia de la sesión\."\},503\)/);
 assert.match(auth,/if\(sessionActive!==true\)return reply\(\{error:"La sesión está revocada, caducada o suspendida\."\},401\)/);
 assert.doesNotMatch(directory,/auth\.admin\.deleteUser/);
});
