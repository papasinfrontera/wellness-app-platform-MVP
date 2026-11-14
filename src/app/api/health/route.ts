import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({service:"wellness-app",status:"foundation",version:"6.1",connectedDatabase:false,aiEnabled:false})}
