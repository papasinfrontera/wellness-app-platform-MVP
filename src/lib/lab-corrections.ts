export type LabCorrection = {
 id:string;observation_id:string;corrected_value:number;corrected_unit:string;reason:string;created_at:string
};
export type CorrectableReading = {id:string;value:number;unit:string};
export function latestCorrections(items:LabCorrection[]):Map<string,LabCorrection>{
 const result=new Map<string,LabCorrection>();
 const ordered=[...items].sort((a,b)=>
  b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id));
 for(const item of ordered)if(!result.has(item.observation_id))result.set(item.observation_id,item);
 return result;
}
export function applyLabCorrections<T extends CorrectableReading>(
 observations:T[],events:LabCorrection[]
):Array<T&{corrected:boolean;originalValue:number;originalUnit:string}>{
 const latest=latestCorrections(events);
 return observations.map(row=>{
  const change=latest.get(row.id);
  return {...row,
   originalValue:row.value,originalUnit:row.unit,
   value:change?Number(change.corrected_value):row.value,
   unit:change?change.corrected_unit:row.unit,
   corrected:Boolean(change)};
 });
}
