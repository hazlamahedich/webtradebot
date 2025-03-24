import { NextResponse } from "next/server";

// Use the same hardcoded client ID as the direct-login page
const CLIENT_ID = "Iv1.2ade8f0a993ffe12";

export async function GET(request: Request) {
  console.log("GitHub OAuth callback triggered");
  
  try {
    const url = new URL(request.url);
    console.log("Callback URL:", url.toString());
    
    const { searchParams } = url;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    if (error) {
      console.error("GitHub OAuth error received:", error, errorDescription);
      return NextResponse.redirect(
        new URL(`/auth/direct-login?error=${encodeURIComponent(errorDescription || error)}`, url)
      );
    }
    
    if (!code) {
      console.error("No code provided in GitHub callback");
      return NextResponse.redirect(new URL("/auth/direct-login?error=no_code", url));
    }

    console.log("Exchanging code for access token");
    // Get client secret from environment variable
    const clientSecret = process.env.GITHUB_SECRET;
    
    if (!clientSecret) {
      console.error("Missing GITHUB_SECRET environment variable");
      return NextResponse.redirect(
        new URL(`/auth/direct-login?error=missing_client_secret`, url)
      );
    }
    
    console.log("Exchange parameters:", {
      clientId: CLIENT_ID,
      hasClientSecret: Boolean(clientSecret),
      code: code.substring(0, 5) + "..." // Only log part of the code for security
    });
    
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || tokenData.error) {
      console.error("GitHub token exchange failed:", tokenResponse.status, tokenData.error, tokenData.error_description);
      return NextResponse.redirect(
        new URL(`/auth/direct-login?error=${encodeURIComponent(tokenData.error_description || tokenData.error || "Token exchange failed")}`, url)
      );
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      console.error("No access token in response");
      return NextResponse.redirect(
        new URL(`/auth/direct-login?error=no_access_token`, url)
      );
    }

    // Get user data from GitHub
    console.log("Fetching user data from GitHub");
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = `GitHub user data fetch failed: ${userResponse.status} ${userResponse.statusText}`;
      console.error(errorText);
      return NextResponse.redirect(
        new URL(`/auth/direct-login?error=${encodeURIComponent(errorText)}`, url)
      );
    }

    const userData = await userResponse.json();
    console.log("Successfully retrieved GitHub user data for:", userData.login);

    // Set cookies for manual session
    const response = NextResponse.redirect(new URL("/dashboard", url));
    
    // Secure cookie for production, non-secure for development
    const isSecure = process.env.NODE_ENV === "production";
    
    // Store minimal user data and token in cookies
    response.cookies.set("github_user_id", userData.id.toString(), {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });
    
    response.cookies.set("github_user_login", userData.login, {
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

    console.log("Authentication successful, redirecting to dashboard");
    return response;
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    const url = new URL(request.url);
    return NextResponse.redirect(
      new URL(`/auth/direct-login?error=${encodeURIComponent((error as Error).message)}`, url)
    );
  }
} 