import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const login=readFileSync("src/app/sprint-6-2/persistencia/page.tsx","utf8");
const reset=readFileSync("src/app/restablecer-contrasena/page.tsx","utf8");
const profile=readFileSync("src/app/mi-perfil/page.tsx","utf8");
const auth=readFileSync("src/app/components/WellnessAuthProvider.tsx","utf8");
test("K4 clean login without demo measurements",()=>{
 assert.match(login,/signInWithPassword/);assert.match(login,/auth\.signUp/);assert.match(login,/router\.replace\("\/mi-bienestar"\)/);
 assert.doesNotMatch(login,/demo_measurements|Agregar ejemplo|Datos de ejemplo/);
});
test("K4 recovery uses generic message and Supabase Auth",()=>{
 assert.match(login,/resetPasswordForEmail/);
 assert.match(login,/restablecer-contrasena/);
 assert.match(login,/Si existe una cuenta asociada/);
 assert.match(auth,/PASSWORD_RECOVERY/);
 assert.match(reset,/recoveryMode/);assert.match(reset,/updateUser\(\{password\}\)/);
 assert.match(reset,/password===confirm/);
});
test("K5 profile hub keeps original five steps and avatar editing",()=>{
 assert.match(profile,/overview\?<div/);assert.match(profile,/Cambiar fotografía/);
 assert.match(profile,/Datos personales/);assert.match(profile,/Medidas y actividad/);
 assert.match(profile,/Mi salud/);assert.match(profile,/Mis hábitos/);assert.match(profile,/Objetivos y privacidad/);
 assert.match(profile,/backToOverview/);assert.match(profile,/if\(await save\(step\)\)/);
 assert.match(profile,/wellness-avatars/);assert.match(profile,/ai_consent/);
});
