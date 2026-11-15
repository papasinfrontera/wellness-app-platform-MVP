declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfData { numpages:number; text:string; info?:Record<string,unknown> }
  interface PdfOptions {max?:number;pagerender?:(page: {getTextContent:(options:{normalizeWhitespace:boolean;disableCombineTextItems:boolean})=>Promise<{items:Array<{str:string;transform:number[];width:number}>}>})=>Promise<string>}
  function parsePdf(data:Buffer,options?:PdfOptions):Promise<PdfData>;
  export default parsePdf;
}
