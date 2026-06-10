import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (process.env.NODE_ENV === 'development') {
    console.log("UAE PASS callback received:", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
      error,
    });
  }

  if (error) {
    return NextResponse.redirect(new URL(`/uaepass-test?uaePassStatus=oauth_error`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/uaepass-test?uaePassStatus=missing_code', request.url));
  }

  const stateCookie = request.cookies.get('uaePassState')?.value;
  if (stateCookie && state && stateCookie !== state) {
    const errorResponse = NextResponse.redirect(new URL('/uaepass-test?uaePassStatus=state_failed', request.url));
    errorResponse.cookies.delete('uaePassProfile');
    errorResponse.cookies.delete('identitySource');
    errorResponse.cookies.delete('identityVerified');
    return errorResponse;
  }

  let profileData = null;

  try {
    const clientId = process.env.UAE_PASS_CLIENT_ID || 'sandbox_stage';
    const clientSecret = process.env.UAE_PASS_CLIENT_SECRET || 'sandbox_stage';
    const redirectUri = process.env.UAE_PASS_REDIRECT_URI || "http://localhost:3000/api/uaepass/callback";
    const tokenUrl = process.env.UAE_PASS_TOKEN_URL || 'https://stg-id.uaepass.ae/idshub/token';

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      if (process.env.NODE_ENV === 'development') {
        const text = await tokenResponse.text().catch(() => 'No text');
        console.log("UAE PASS token fetch failed with status:", tokenResponse.status, text);
      }
      const errorResponse = NextResponse.redirect(new URL('/uaepass-test?uaePassStatus=token_failed', request.url));
      errorResponse.cookies.delete('uaePassProfile');
      errorResponse.cookies.delete('identitySource');
      errorResponse.cookies.delete('identityVerified');
      return errorResponse;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      const errorResponse = NextResponse.redirect(new URL('/uaepass-test?uaePassStatus=missing_access_token', request.url));
      errorResponse.cookies.delete('uaePassProfile');
      errorResponse.cookies.delete('identitySource');
      errorResponse.cookies.delete('identityVerified');
      return errorResponse;
    }

    const userInfoUrl = process.env.UAE_PASS_USERINFO_URL || 'https://stg-id.uaepass.ae/idshub/userinfo';
    let userInfoResponse = await fetch(userInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      userInfoResponse = await fetch(userInfoUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
    }

    if (!userInfoResponse.ok) {
      if (process.env.NODE_ENV === 'development') {
        const text = await userInfoResponse.text().catch(() => 'No text');
        console.log("UAE PASS userinfo failed with status:", userInfoResponse.status, "and body:", text);
      }
      const errorResponse = NextResponse.redirect(new URL('/uaepass-test?uaePassStatus=userinfo_failed', request.url));
      errorResponse.cookies.delete('uaePassProfile');
      errorResponse.cookies.delete('identitySource');
      errorResponse.cookies.delete('identityVerified');
      return errorResponse;
    }

    let userinfo;
    try {
      userinfo = await userInfoResponse.json();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.log("UAE PASS userinfo json parse failed.");
      }
      const errorResponse = NextResponse.redirect(new URL('/uaepass-test?uaePassStatus=userinfo_failed', request.url));
      errorResponse.cookies.delete('uaePassProfile');
      errorResponse.cookies.delete('identitySource');
      errorResponse.cookies.delete('identityVerified');
      return errorResponse;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("UAE PASS token status:", tokenResponse.status);
      console.log("UAE PASS userinfo status:", userInfoResponse.status);
      console.log("UAE PASS userinfo keys:", Object.keys(userinfo || {}));
    }

    const normalizedProfile = {
      fullName: userinfo.fullnameEN || userinfo.fullNameEN || userinfo.fullnameAR || userinfo.fullNameAR || userinfo.name || userinfo.displayName || userinfo.cn || "",
      emiratesId: userinfo.idn || userinfo.Idn || userinfo.IDN || userinfo.emiratesId || userinfo.emiratesID || userinfo.nationalId || "",
      email: userinfo.email || userinfo.mail || "",
      mobile: userinfo.mobile || userinfo.mobileNumber || userinfo.phone_number || "",
      uuid: userinfo.uuid || userinfo.UUID || userinfo.sub || "",
      rawReturnedKeys: Object.keys(userinfo || {})
    };

    if (!normalizedProfile.uuid && !normalizedProfile.fullName && !normalizedProfile.email && !normalizedProfile.mobile && !normalizedProfile.emiratesId) {
      const errorResponse = NextResponse.redirect(new URL('/uaepass-test?uaePassStatus=profile_failed', request.url));
      errorResponse.cookies.delete('uaePassProfile');
      errorResponse.cookies.delete('identitySource');
      errorResponse.cookies.delete('identityVerified');
      return errorResponse;
    }

    profileData = normalizedProfile;

  } catch (error) {
    console.error("UAE PASS Callback Error:", error);
    const errorResponse = NextResponse.redirect(new URL('/uaepass-test?uaePassStatus=profile_failed', request.url));
    errorResponse.cookies.delete('uaePassProfile');
    errorResponse.cookies.delete('identitySource');
    errorResponse.cookies.delete('identityVerified');
    return errorResponse;
  }

  // Create response with profile data in cookies
  const response = NextResponse.redirect(new URL(`/apply?mode=uaepass-test&identity=verified`, request.url));

  // Store audit events for UAE PASS callback received, userinfo retrieved, identity verified
  const auditEvents = [
    {
      timestamp: new Date().toISOString(),
      actor: "Beneficiary",
      action: "UAE PASS staging callback received",
      result: "Success",
      reasonCode: "IDENTITY_UAE_PASS_CODE_RECEIVED",
      dataSource: "UAE PASS Staging",
    },
    {
      timestamp: new Date().toISOString(),
      actor: "AI Agent",
      action: "UAE PASS staging userinfo retrieved",
      result: "Success",
      reasonCode: "IDENTITY_UAE_PASS_USERINFO_RETRIEVED",
      dataSource: "UAE PASS Staging",
    },
    {
      timestamp: new Date().toISOString(),
      actor: "AI Agent",
      action: "Identity verified via UAE PASS staging",
      result: "Success",
      reasonCode: "IDENTITY_UAE_PASS_VERIFIED",
      dataSource: "UAE PASS Staging",
    },
  ];

  response.cookies.set('uaePassAuditEvents', JSON.stringify(auditEvents), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Store profile in cookie, httpOnly false to read it on apply page
  response.cookies.set('uaePassProfile', encodeURIComponent(JSON.stringify(profileData)), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });

  response.cookies.set('identityVerified', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  response.cookies.set('identitySource', 'UAE PASS Staging', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  return response;
}
