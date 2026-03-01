import { NextResponse } from 'next/server';

export async function GET() {
  // Check for all possible token names
  const supervisorToken = process.env.SUPERVISOR_TOKEN;
  const hassioToken = process.env.HASSIO_TOKEN;
  
  // Check if running under HA Supervisor
  const hasHassioApi = process.env.HASSIO_TOKEN || process.env.SUPERVISOR_TOKEN;
  
  return NextResponse.json({
    hasSupervisorToken: !!supervisorToken,
    hasHassioToken: !!hassioToken,
    supervisorTokenLength: supervisorToken?.length || 0,
    hassioTokenLength: hassioToken?.length || 0,
    runningUnderHassio: !!hasHassioApi,
    // Show ALL env vars to debug what's available
    allEnvVars: Object.keys(process.env).sort(),
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
