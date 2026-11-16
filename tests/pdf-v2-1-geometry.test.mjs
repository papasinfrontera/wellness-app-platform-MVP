import test from "node:test";
import assert from "node:assert/strict";
import {reconstructPdfRows} from "../src/lib/pdf-layout-reconstruction.ts";
const item=(x,y,str,width=25)=>({str,transform:[1,0,0,1,x,y],width});
test("reconstructs columns from unsorted PDF content stream",()=>{
 const input=[
  item(430,500,"13 - 17.5",42),item(30,480,"Hematocrito",80),
  item(280,500,"15.40"),item(360,500,"g/dL"),
  item(280,480,"49.0"),item(360,480,"%"),item(30,500,"Hemoglobina",80),
  item(430,480,"40 - 50",38)
 ];
 assert.equal(reconstructPdfRows(input),
  "Hemoglobina\t15.40\tg/dL\t13 - 17.5\nHematocrito\t49.0\t%\t40 - 50");
});
test("drops isolated high-low clinical flags without turning them into result columns",()=>{
 const input=[item(30,500,"Glucosa",60),item(245,500,"↑",7),item(300,500,"114",20),item(370,500,"mg/dL",38),item(440,500,"70 - 105",44)];
 assert.equal(reconstructPdfRows(input),"Glucosa\t114\tmg/dL\t70 - 105");
});
test("rejects non-finite positioned text safely",()=>{
 const input=[item(NaN,300,"PRIVATE",10),item(20,300,"Glucosa",40),item(180,300,"92",14)];
 assert.equal(reconstructPdfRows(input),"Glucosa\t92");
});
