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
 // Some lab exports vertically center the value and row number between two
 // lines of a wrapped label (e.g. CHCM). Rejoin label-only fragments by their
 // proximity to a numbered measurement row, without joining adjacent tests.
 const absorbed=new Set<number>();
 for(let anchorIndex=0;anchorIndex<lines.length;anchorIndex++){
  const anchor=lines[anchorIndex];
  const number=anchor.find(x=>x.x<100&&/^\d{1,3}$/.test(x.text));
  const result=anchor.find(x=>x.x>(number?.x??0)+150&&/^[<>≤≥]?\s*\d/.test(x.text));
  if(!number||!result)continue;
  const anchorY=number.y;
  if(anchor.some(x=>x.x>=number.x+12&&x.x<result.x-10&&/[\p{L}]/u.test(x.text)))continue;
  for(let fragmentIndex=0;fragmentIndex<lines.length;fragmentIndex++){
   if(fragmentIndex===anchorIndex||absorbed.has(fragmentIndex))continue;
   const fragment=lines[fragmentIndex];
   if(fragment.length!==1)continue;
   const part=fragment[0];
   if(Math.abs(part.y-anchorY)>8.5)continue;
   if(part.x<=number.x+12||part.x>=result.x-10)continue;
   if(!/[\p{L}]/u.test(part.text)||/^\d{1,3}$/.test(part.text))continue;
   anchor.push(part);
   absorbed.add(fragmentIndex);
  }
 }
 return lines.filter((_,i)=>!absorbed.has(i)).map(line=>{
  line.sort((a,b)=>a.x-b.x||b.y-a.y);
  let output="",right:number|null=null;
  for(const item of line){
   if(right!==null)output+=item.x-right>12?"\t":" ";
   output+=item.text;
   right=Math.max(right??item.right,item.right);
  }
  return output.trim();
 }).filter(Boolean).join("\n");
}
