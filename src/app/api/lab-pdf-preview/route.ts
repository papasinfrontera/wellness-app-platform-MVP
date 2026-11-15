import {NextResponse} from "next/server";
import {PDFParse} from "pdf-parse";
import catalog from "@/app/(dashboard)/mi-analisis/catalog-reference.json";
import {analyzeExtractedText} from "@/lib/pdf-lab-review";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const MAX_BYTES=5*1024*1024;
const headers={"Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff"};
function fail(error:string,status:number){return NextResponse.json({error},{status,headers});}
export async function POST(request:Request){
 const type=request.headers.get("content-type")||"";
 if(!type.includes("multipart/form-data"))return fail("Se requiere un archivo PDF.",415);
 const length=Number(request.headers.get("content-length")||0);
 if(length>MAX_BYTES+1024*1024)return fail("El documento excede el tamaño máximo de 5 MB.",413);
 let parser:PDFParse|null=null;
 try{
  const form=await request.formData();
  const file=form.get("file");
  if(!(file instanceof File))return fail("Selecciona un archivo PDF.",400);
  if(file.size===0||file.size>MAX_BYTES)return fail("El archivo debe ser PDF y tener como máximo 5 MB.",413);
  if(!/\.pdf$/i.test(file.name)||file.type&&file.type!=="application/pdf"&&file.type!=="application/octet-stream")return fail("Solo se permiten documentos PDF.",415);
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(new TextDecoder("ascii").decode(bytes.subarray(0,5))!=="%PDF-")return fail("El archivo no tiene una cabecera PDF válida.",415);
  parser=new PDFParse({data:bytes});
  const info=await parser.getInfo();
  if(!info.total||info.total>12)return fail("El piloto admite documentos digitales de hasta 12 páginas.",422);
  const extracted=await parser.getText();
  const review=analyzeExtractedText(extracted.text,catalog,80);
  return NextResponse.json({pages:info.total,...review,storage:"none",phase:"review_only"},{headers});
 }catch{
  return fail("No fue posible leer el PDF. Comprueba que no esté protegido, dañado o escaneado.",422);
 }finally{
  if(parser)await parser.destroy().catch(()=>undefined);
 }
}
