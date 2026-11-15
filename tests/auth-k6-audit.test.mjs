import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=path=>readFileSync(path,"utf8");
const auth=load("src/app/components/WellnessAuthProvider.tsx");
const dashboard=load("src/app/(dashboard)/layout.tsx");
const login=load("src/app/sprint-6-2/persistencia/page.tsx");
const profile=load("src/app/mi-perfil/page.tsx");
const publicNav=load("src/app/components/PublicAuthNav.tsx");
const root=load("src/app/layout.tsx");
test("K6 server revalidates a returning private tab before rendering protected content",()=>{
 assert.match(auth,/const onVisible=\(\)=>\{/);
 assert.match(auth,/document\.visibilityState==="visible"/);
 assert.match(auth,/setStatus\("loading"\);\s*void refreshAuth\(\)/);
 assert.match(auth,/client\.auth\.getUser\(\)/);
 assert.match(dashboard,/status==="signed_in"\?children/);
});
test("K6 switching identities hides previous user's profile while authentication is verified",()=>{
 assert.match(auth,/session\?\.user\?\.id&&session\.user\.id!==userId\.current/);
 assert.match(auth,/userId\.current=null;setUser\(null\);setIdentity\(empty\);setStatus\("loading"\)/);
 assert.match(auth,/request!==authRequest\.current/);
 assert.match(auth,/setUser\(null\);setIdentity\(empty\);setStatus\("signed_out"\);setRecoveryMode\(false\)/);
});
test("K6 account dropdown is keyboard dismissible and navigates to actual requested sections",()=>{
 assert.match(dashboard,/event\.key==="Escape"/);
 assert.match(dashboard,/querySelector\("summary"\)\?\.focus\(\)/);
 assert.match(dashboard,/mi-perfil\?seccion=5/);
 assert.match(dashboard,/mi-perfil\?seccion=1/);
 assert.match(profile,/new URLSearchParams\(window\.location\.search\)\.get\("seccion"\)/);
 assert.match(profile,/requested>=1&&requested<=5/);
});
test("K6 private avatar is shared and refreshed, never served from public storage",()=>{
 assert.match(profile,/const avatar=identity\.avatarUrl/);
 assert.doesNotMatch(profile,/createSignedUrl/);
 assert.match(auth,/createSignedUrl\(photoPath,900\)/);
 assert.doesNotMatch(auth,/getPublicUrl/);
 assert.match(publicNav,/photoError/);
 assert.match(publicNav,/onError=\{\(\)=>setPhotoError\(true\)\}/);
});
test("K6 login and public header reflect session state and allow changing account",()=>{
 assert.match(login,/Cerrar sesión y acceder con otra cuenta/);
 assert.match(login,/await signOut\(\)/);
 assert.match(root,/<PublicAuthNav\/>/);
 assert.match(publicNav,/status==="signed_in"&&user/);
 assert.match(publicNav,/identity\.avatarUrl/);
 assert.match(publicNav,/Acceder/);
});
