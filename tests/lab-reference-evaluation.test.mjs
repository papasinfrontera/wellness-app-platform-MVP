import test from "node:test";
import assert from "node:assert/strict";
import {evaluateLabReference} from "../src/lib/lab-reference-evaluation.ts";
test("no reference, unverified range or mismatched unit never creates clinical status",()=>{
 const sample={value:93,unit:"mg/dL",specimen:"plasma"};
 assert.equal(evaluateLabReference(sample,null),"not_evaluated");
 assert.equal(evaluateLabReference(sample,{low:65,high:110,unit:"mg/dL",verified:false}),"not_evaluated");
 assert.equal(evaluateLabReference(sample,{low:3.6,high:6.1,unit:"mmol/L",verified:true}),"not_evaluated");
 assert.equal(evaluateLabReference(sample,{low:65,high:110,unit:"mg/dL",verified:true,specimen:"urine"}),"not_evaluated");
});
test("only matching verified laboratory intervals can be compared, never called optimal",()=>{
 const sample={value:93,unit:"mg/dL",specimen:"plasma"};
 assert.equal(evaluateLabReference(sample,{low:65,high:110,unit:"mg/dL",specimen:"plasma",verified:true}),"within_reference");
 assert.equal(evaluateLabReference(sample,{low:100,high:110,unit:"mg/dL",specimen:"plasma",verified:true}),"outside_reference");
});
