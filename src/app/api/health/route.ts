import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const headersList = headers();
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.2.0',
    environment: {
      hasSupervisorToken: !!process.env.SUPERVISOR_TOKEN,
      hasHassioToken: !!process.env.HASSIO_TOKEN,
      supervisorTokenLength: process.env.SUPERVISOR_TOKEN?.length || 0,
      hassioTokenLength: process.env.HASSIO_TOKEN?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      hostname: process.env.HOSTNAME,
      // List all env vars (excluding secrets)
      allEnvVars: Object.keys(process.env).filter(k => 
        !k.includes('TOKEN') && 
        !k.includes('SECRET') && 
        !k.includes('PASSWORD') &&
        !k.includes('KEY')
      ),
    },
    requestHeaders: {
      // Show headers relevant to HA ingress/auth
      hasXIngressPath: !!headersList.get('x-ingress-path'),
      hasXRemoteUser: !!headersList.get('x-remote-user'),
      hasXHassUserId: !!headersList.get('x-hass-user-id'),
      hasAuthorization: !!headersList.get('authorization'),
      contentType: headersList.get('content-type'),
      userAgent: headersList.get('user-agent'),
    }
  });
}
