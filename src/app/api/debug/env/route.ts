import { NextResponse } from 'next/server';

export async function GET() {
  const hasToken = !!process.env.SUPERVISOR_TOKEN;
  const tokenLength = process.env.SUPERVISOR_TOKEN?.length || 0;
  
  return NextResponse.json({
    hasSupervisorToken: hasToken,
    tokenLength: tokenLength,
    envVars: Object.keys(process.env).filter(key => 
      !key.includes('npm') && 
      !key.includes('NODE') && 
      !key.includes('PATH')
    ),
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
