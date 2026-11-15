import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const provider=read("src/app/components/WellnessAuthProvider.tsx");
const layout=read("src/app/(dashboard)/layout.tsx");
const root=read("src/app/layout.tsx");
const profile=read("src/app/mi-perfil/page.tsx");
const login=read("src/app/sprint-6-2/persistencia/page.tsx");
const styles=read("src/app/(dashboard)/dashboard.css");
test("K1 private photo appears only after verified session and uses temporary signed URLs",()=>{
 assert.match(provider,/client\.auth\.getUser\(\)/);
 assert.match(provider,/from\("wellness_profiles"\)/);
 assert.match(provider,/createSignedUrl\(photoPath,900\)/);
 assert.match(provider,/if\(!mounted\.current\|\|request!==currentRequest\.current\|\|userId\.current!==id\)return/);
 assert.match(layout,/identity\.avatarUrl/);
 assert.match(layout,/wb-avatar-img/);
 assert.match(layout,/initials/);
 assert.doesNotMatch(provider,/getPublicUrl\(/);
});
test("K2 dropdown has identity, navigation and working sign-out",()=>{
 assert.match(layout,/<details ref=\{menu\}/);
 assert.match(layout,/<summary className="wb-account-trigger"/);
 assert.match(layout,/aria-label=\{"Cuenta de "/);
 assert.match(layout,/await signOut\(\)/);
 assert.match(layout,/router\.replace\("\/sprint-6-2\/persistencia"\)/);
 assert.match(layout,/Cerrar sesión/);
});
test("K3 central provider guards dashboard and synchronizes profile and login",()=>{
 assert.match(root,/<AuthProvider>/);
 assert.match(layout,/status==="signed_in"\?children/);
 assert.match(layout,/Verificando tu sesión privada/);
 assert.match(layout,/status==="error"/);
 assert.match(profile,/useWellnessAuth\(\)/);
 assert.match(profile,/await refreshProfile\(\)/);
 assert.match(login,/useWellnessAuth\(\)/);
 assert.doesNotMatch(login,/onAuthStateChange/);
});
test("K3 sign-out prevents stale authentication requests from restoring private user state",()=>{
 assert.match(provider,/const authRequest=useRef\(0\)/);
 assert.match(provider,/request!==authRequest\.current/);
 assert.match(provider,/\+\+authRequest\.current;\+\+currentRequest\.current/);
 assert.match(provider,/setIdentity\(empty\);setStatus\("signed_out"\)/);
 assert.match(provider,/typeof window==="undefined"/);
});
test("header remains accessible and visible on mobile",()=>{
 assert.match(layout,/aria-label="Opciones de cuenta"/);
 assert.match(styles,/@media\(max-width:810px\)[\s\S]*\.wb-topbar\{display:flex/);
 assert.match(styles,/focus-visible/);
 assert.match(styles,/\.wb-avatar\{/);
});
