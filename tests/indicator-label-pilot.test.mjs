import test from "node:test";
import assert from "node:assert/strict";
import {recognizePilotLabel} from "../src/lib/indicator-label-pilot.ts";
const cases=[
 ["Apolipoproteína B (ApoB)","REF-001"],["Apolipoprotein B","REF-001"],["ApoB","REF-001"],["Apo B","REF-001"],
 ["Glucosa","REF-017"],["Glucose","REF-017"],["Glicemia","REF-017"],["Glucemia","REF-017"],
 ["Blood glucose","REF-017"],["Glucosa en sangre","REF-017"],
 ["GLUCOSA (mg/dL)","REF-017"],["GLUCOSE (mmol/L)","REF-017"]
];
for(const [label,expected] of cases)test("alias exacto: "+label,()=>{const x=recognizePilotLabel(label);assert.equal(x.status,"candidate");assert.equal(x.code,expected);});
for(const label of ["Glucose urine","Glucosa en orina","Glucosa posprandial","Fasting glucose","Glucose CSF","Glucose tolerance test","GLU","Creatinine","","HbA1c","Apo B oxidada"]){
 test("abstenerse y solicitar revisión: "+JSON.stringify(label),()=>assert.equal(recognizePilotLabel(label).status,"review"));
}
test("código e identidad estables",()=>{assert.equal(recognizePilotLabel("ApoB").code,"REF-001");assert.equal(recognizePilotLabel("Glucose").code,"REF-017")});
