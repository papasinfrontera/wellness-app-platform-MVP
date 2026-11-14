// Sprint 6.5: extract ONLY public indicator names from an immutable, preserved demo blob.
// Never copy historical lab values, patient details or clinical classifications into this repository.
import {gunzipSync} from "node:zlib";
import {writeFile, mkdir} from "node:fs/promises";
import {dirname} from "node:path";
const blobSha="06a53fcf291eb81306abebd271e2db7ffb1a85de";
const url="https://api.github.com/repos/papasinfrontera/wellness-app-demo/git/blobs/"+blobSha;
const r=await fetch(url,{headers:{Accept:"application/vnd.github+json","User-Agent":"WELLNESS-APP-catalog-metadata-build"}});
if(!r.ok)throw new Error("No se pudo consultar la referencia del catálogo.");
const blob=await r.json();
if(blob.encoding!=="base64"||typeof blob.content!=="string")throw new Error("Referencia inesperada.");
const html=Buffer.from(blob.content.replace(/\s/g,""),"base64").toString("utf8");
const match=html.match(/Uint8Array\.from\(atob\("([A-Za-z0-9+/=]+)"\)/);
if(!match)throw new Error("No se encontró el catálogo de referencia.");
const original=JSON.parse(gunzipSync(Buffer.from(match[1],"base64")).toString("utf8"));
if(!Array.isArray(original.indicadores)||original.indicadores.length!==128)throw new Error("El catálogo no contiene 128 indicadores.");
const unique=new Set();
const catalog=original.indicadores.map((entry,index)=>{
 const name=String(entry.indicador||"").trim();
 const key=name.normalize("NFKC").toLocaleLowerCase("es");
 if(!name||unique.has(key))throw new Error("Error de integridad de nombres.");
 unique.add(key);
 return {id:index+1,name};
});
const output="src/app/(dashboard)/mi-analisis/catalog-reference.json";
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(catalog,null,2)+"\n","utf8");
console.log("Catálogo público de nombres sanitizado: "+catalog.length+" indicadores. Sin resultados personales.");
