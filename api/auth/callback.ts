import { NextApiRequest, NextApiResponse } from "next";
import { UserAuthManager, UserSession } from "../../src/utils/user-auth.js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, state, error } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error("OAuth error:", error);
      return res.status(400).json({
        success: false,
        error: "OAuth authorization failed",
        details: error,
      });
    }

    // Validate required parameters
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: "Missing authorization code or state parameter",
      });
    }

    // Validate state parameter (CSRF protection)
    const cookies = req.headers.cookie || "";

    // Parse cookies properly
    const cookieMap = new Map();
    cookies.split(";").forEach((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      if (name && valueParts.length > 0) {
        cookieMap.set(name, valueParts.join("=")); // Handle values with = in them
      }
    });

    const oauthStateCookie = cookieMap.get("oauth_state");

    console.log("Debug CSRF validation:", {
      receivedState: state,
      cookieState: oauthStateCookie,
      allCookies: cookies,
      cookieMap: Object.fromEntries(cookieMap),
      match: oauthStateCookie === state,
    });

    if (!oauthStateCookie || oauthStateCookie !== state) {
      return res.status(400).json({
        success: false,
        error: "Invalid state parameter - possible CSRF attack",
        debug: {
          receivedState: state,
          cookieState: oauthStateCookie,
          cookiesPresent: !!cookies,
          allCookies: cookies,
          cookieMap: Object.fromEntries(cookieMap),
        },
      });
    }

    // Exchange authorization code for access token
    const tokens = await UserAuthManager.exchangeCodeForTokens(code as string);

    // Get user information from Meta
    const userInfo = await UserAuthManager.getMetaUserInfo(tokens.accessToken);

    // Create user session
    const userId = `meta_${userInfo.id}`;
    const session: UserSession = {
      userId: userId,
      email: userInfo.email,
      name: userInfo.name,
      metaUserId: userInfo.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiration: tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : undefined,
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    // Store user session and tokens
    await UserAuthManager.storeUserSession(session);
    await UserAuthManager.storeUserTokens(userId, tokens);

    // Generate JWT session token
    const sessionToken = await UserAuthManager.createSessionToken(userId);

    // Clear OAuth state cookie and set session cookie
    // Use different cookie settings based on environment
    const isProduction =
      req.headers.host?.includes("vercel.app") ||
      req.headers.host?.includes("netlify.app") ||
      req.headers.host?.includes("coyotiv.com");

    const cookieOptions = isProduction
      ? `HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`
      : `HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`;

    console.log("Setting session cookie:", {
      sessionToken: sessionToken.substring(0, 20) + "...",
      cookieOptions,
      host: req.headers.host,
      isProduction,
    });

    res.setHeader("Set-Cookie", [
      `oauth_state=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`, // Clear state cookie
      `session_token=${sessionToken}; ${cookieOptions}`, // 7 days
    ]);

    // Redirect to dashboard with session token as query param as backup
    res.redirect(302, `/api/dashboard?token=${sessionToken}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
