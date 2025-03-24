import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  
  if (!code) {
    return NextResponse.redirect(new URL("/auth/fallback?error=no_code", request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`GitHub token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(`/auth/fallback?error=${tokenData.error}`, request.url)
      );
    }

    const accessToken = tokenData.access_token;

    // Get user data from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error(`GitHub user data fetch failed: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();

    // Set cookies for emergency session
    const response = NextResponse.redirect(new URL("/emergency-dashboard", request.url));
    
    // Secure cookie for production, non-secure for development
    const isSecure = process.env.NODE_ENV === "production";
    
    // Store minimal user data and token in cookies
    response.cookies.set("github_user_id", userData.id.toString(), {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });
    
    response.cookies.set("github_user_name", userData.login, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });
    
    response.cookies.set("github_access_token", accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/auth/fallback?error=${encodeURIComponent((error as Error).message)}`, request.url)
    );
  }
} 