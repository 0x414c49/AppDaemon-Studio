import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { existsSync } from 'fs';

export async function GET() {
  const headersList = await headers();
  
  const hasSupervisorTokenEnv = !!process.env.SUPERVISOR_TOKEN;
  const hasHassioTokenEnv = !!process.env.HASSIO_TOKEN;
  const hasSupervisorTokenFile = existsSync('/tmp/supervisor_token');
  const hasHassioTokenFile = existsSync('/tmp/hassio_token');
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.2.0',
    environment: {
      hasSupervisorToken: hasSupervisorTokenEnv || hasSupervisorTokenFile,
      hasHassioToken: hasHassioTokenEnv || hasHassioTokenFile,
      supervisorTokenSource: hasSupervisorTokenEnv ? 'env' : hasSupervisorTokenFile ? 'file' : 'none',
      hassioTokenSource: hasHassioTokenEnv ? 'env' : hasHassioTokenFile ? 'file' : 'none',
      nodeEnv: process.env.NODE_ENV,
      hostname: process.env.HOSTNAME,
      allEnvVars: Object.keys(process.env).filter(k => 
        !k.includes('TOKEN') && 
        !k.includes('SECRET') && 
        !k.includes('PASSWORD') &&
        !k.includes('KEY')
      ),
    },
    requestHeaders: {
      hasXIngressPath: !!headersList.get('x-ingress-path'),
      hasXRemoteUser: !!headersList.get('x-remote-user'),
      hasXHassUserId: !!headersList.get('x-hass-user-id'),
      hasAuthorization: !!headersList.get('authorization'),
      contentType: headersList.get('content-type'),
      userAgent: headersList.get('user-agent'),
    }
  });
}
