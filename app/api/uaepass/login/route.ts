import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const flow = searchParams.get('flow') || 'uaepass-test';

  // Generate a secure random state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Store audit log for UAE PASS staging login started
  const auditEvent = {
    timestamp: new Date().toISOString(),
    actor: "Beneficiary",
    action: "UAE PASS staging login started",
    result: "Success",
    reasonCode: "IDENTITY_UAE_PASS_STAGING_STARTED",
    dataSource: "UAE PASS Staging",
  };

  // Store audit event in cookie for later retrieval
  const response = NextResponse.next();
  response.cookies.set('uaePassAudit', JSON.stringify(auditEvent), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Store state in cookie for validation on callback
  response.cookies.set('uaePassState', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });

  // Build UAE PASS staging authorization URL
  const clientId = process.env.UAE_PASS_CLIENT_ID || 'sandbox_stage';
  const redirectUri = process.env.UAE_PASS_REDIRECT_URI || 'http://localhost:3000/api/uaepass/callback';
  const authorizeUrl = process.env.UAE_PASS_AUTHORIZE_URL || 'https://stg-id.uaepass.ae/idshub/authorize';

  const authUrl = new URL(authorizeUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'urn:uae:digitalid:profile:general');
  authUrl.searchParams.set('acr_values', 'urn:safelayer:tws:policies:authentication:level:low');
  authUrl.searchParams.set('state', state);

  // Redirect to UAE PASS staging authorization endpoint
  const redirectResponse = NextResponse.redirect(authUrl.toString());
  
  // Clear any stale profile cookies before starting
  redirectResponse.cookies.delete('uaePassProfile');
  redirectResponse.cookies.delete('identitySource');
  redirectResponse.cookies.delete('identityVerified');
  
  return redirectResponse;
}
