/** Geometric reconstruction of PDF.js text items. No medical values are logged. */
export type PositionedPdfText={str:string;transform:number[];width:number};
export function reconstructPdfRows(items:PositionedPdfText[]):string{
 type Entry={text:string;x:number;y:number;right:number};
 const entries:Entry[]=[];
 for(const item of items){
  const text=typeof item.str==="string"?item.str.trim():"";
  if(!text||/^[↑↓]+$/.test(text))continue;
  const x=item.transform?.[4],y=item.transform?.[5];
  if(!Number.isFinite(x)||!Number.isFinite(y))continue;
  entries.push({text,x,y,right:x+Math.max(0,Number.isFinite(item.width)?item.width:0)});
 }
 // PDF content streams are not guaranteed to be in visual reading order.
 entries.sort((a,b)=>b.y-a.y||a.x-b.x);
 const lines:Entry[][]=[];
 for(const current of entries){
  const last=lines.at(-1);
  if(last&&Math.abs(last[0].y-current.y)<=2)last.push(current);
  else lines.push([current]);
 }
 return lines.map(line=>{
  line.sort((a,b)=>a.x-b.x);
  let output="",right:number|null=null;
  for(const item of line){
   if(right!==null)output+=item.x-right>12?"\t":" ";
   output+=item.text;
   right=Math.max(right??item.right,item.right);
  }
  return output.trim();
 }).filter(Boolean).join("\n");
}
