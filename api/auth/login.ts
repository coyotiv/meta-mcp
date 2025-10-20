import { NextApiRequest, NextApiResponse } from 'next';
import { UserAuthManager } from '../../src/utils/user-auth.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate OAuth state for CSRF protection
    const state = await UserAuthManager.generateOAuthState();
    
    console.log('Generated OAuth state:', state);
    
    // Store state in a secure cookie for validation later
    const isProduction = req.headers.host?.includes('vercel.app') || req.headers.host?.includes('netlify.app') || req.headers.host?.includes('coyotiv.com');
    
    // Different cookie settings for different environments
    const cookieOptions = isProduction 
      ? `HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`
      : `HttpOnly; SameSite=Lax; Max-Age=600; Path=/`;
    
    console.log('Setting cookie with options:', cookieOptions);
    
    res.setHeader('Set-Cookie', [
      `oauth_state=${state}; ${cookieOptions}`, // 10 minutes
    ]);

    // Generate Meta OAuth URL
    const authUrl = UserAuthManager.generateMetaOAuthUrl(state);

    // Return the authorization URL
    res.status(200).json({
      success: true,
      authUrl: authUrl,
      message: 'Redirect user to this URL to begin OAuth flow'
    });
  } catch (error) {
    console.error('OAuth login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}