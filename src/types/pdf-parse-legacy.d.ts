declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfData { numpages:number; text:string; info?:Record<string,unknown> }
  interface PdfOptions {max?:number}
  function parsePdf(data:Buffer,options?:PdfOptions):Promise<PdfData>;
  export default parsePdf;
}
