import { SignJWT, jwtVerify } from 'jose';
import { AuthManager } from './auth.js';
import type { MetaApiConfig } from '../types/meta-api.js';

// Storage interface
interface StorageAdapter {
  set(key: string, value: any, options?: { ex?: number }): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  del(key: string): Promise<void>;
}

// Vercel KV adapter
class VercelKVAdapter implements StorageAdapter {
  private kv: any;

  constructor() {
    // Dynamically import Vercel KV
    this.kv = null;
    this.initKV();
  }

  private async initKV() {
    try {
      const { kv } = await import('@vercel/kv');
      this.kv = kv;
    } catch (error) {
      console.warn('Vercel KV not available:', error);
    }
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    if (!this.kv) await this.initKV();
    if (!this.kv) throw new Error('Vercel KV not available');
    await this.kv.set(key, value, options);
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.kv) await this.initKV();
    if (!this.kv) throw new Error('Vercel KV not available');
    return await this.kv.get(key) as T | null;
  }

  async del(key: string): Promise<void> {
    if (!this.kv) await this.initKV();
    if (!this.kv) throw new Error('Vercel KV not available');
    await this.kv.del(key);
  }
}

// Redis adapter
class RedisAdapter implements StorageAdapter {
  private client: any;
  private isConnected = false;

  constructor() {
    this.client = null;
    this.initRedis();
  }

  private async initRedis() {
    try {
      const { createClient } = await import('redis');
      this.client = createClient({
        url: process.env.REDIS_URL
      });

      this.client.on('error', (err: any) => {
        console.error('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Redis not available:', error);
    }
  }

  private async ensureConnected() {
    if (!this.client) await this.initRedis();
    if (!this.client) throw new Error('Redis not available');
    if (!this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        // Client might already be connected
        console.warn('Redis connection warning:', error);
      }
    }
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    await this.ensureConnected();
    const serialized = JSON.stringify(value);
    if (options?.ex) {
      await this.client.setEx(key, options.ex, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ensureConnected();
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.ensureConnected();
    await this.client.del(key);
  }
}

// Storage factory
function createStorageAdapter(): StorageAdapter {
  if (process.env.REDIS_URL) {
    console.log('Using Redis storage adapter');
    return new RedisAdapter();
  } else if (process.env.KV_REST_API_URL) {
    console.log('Using Vercel KV storage adapter');
    return new VercelKVAdapter();
  } else {
    throw new Error('No storage configuration found. Set either REDIS_URL or KV_REST_API_URL');
  }
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  metaUserId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiration?: Date;
  createdAt: Date;
  lastUsed: Date;
}

export interface UserTokenData {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
  scope: string[];
}

export class UserAuthManager {
  private static JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static JWT_EXPIRY = '7d'; // 7 days
  private static SESSION_PREFIX = 'user_session:';
  private static TOKEN_PREFIX = 'user_tokens:';
  private static storage: StorageAdapter | null = null;

  /**
   * Get storage adapter instance
   */
  private static getStorage(): StorageAdapter {
    if (!this.storage) {
      this.storage = createStorageAdapter();
    }
    return this.storage;
  }

  /**
   * Create a JWT session token for a user
   */
  static async createSessionToken(userId: string): Promise<string> {
    const secret = new TextEncoder().encode(this.JWT_SECRET);
    
    const jwt = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(this.JWT_EXPIRY)
      .sign(secret);

    return jwt;
  }

  /**
   * Verify and decode a JWT session token
   */
  static async verifySessionToken(token: string): Promise<{ userId: string } | null> {
    try {
      const secret = new TextEncoder().encode(this.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      if (typeof payload.userId === 'string') {
        return { userId: payload.userId };
      }
      return null;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Store user session data in storage
   */
  static async storeUserSession(session: UserSession): Promise<void> {
    const storage = this.getStorage();
    const key = `${this.SESSION_PREFIX}${session.userId}`;
    await storage.set(key, session, { ex: 7 * 24 * 60 * 60 }); // 7 days expiry
  }

  /**
   * Get user session from storage
   */
  static async getUserSession(userId: string): Promise<UserSession | null> {
    const storage = this.getStorage();
    const key = `${this.SESSION_PREFIX}${userId}`;
    const session = await storage.get<UserSession>(key);
    
    if (session) {
      // Update last used timestamp
      session.lastUsed = new Date();
      await this.storeUserSession(session);
    }
    
    return session;
  }

  /**
   * Store user Meta tokens securely
   */
  static async storeUserTokens(userId: string, tokens: UserTokenData): Promise<void> {
    const storage = this.getStorage();
    const key = `${this.TOKEN_PREFIX}${userId}`;
    const tokenData = {
      ...tokens,
      updatedAt: new Date().toISOString(),
    };
    await storage.set(key, tokenData, { ex: 60 * 24 * 60 * 60 }); // 60 days expiry
  }

  /**
   * Get user Meta tokens
   */
  static async getUserTokens(userId: string): Promise<UserTokenData | null> {
    const storage = this.getStorage();
    const key = `${this.TOKEN_PREFIX}${userId}`;
    return await storage.get<UserTokenData>(key);
  }

  /**
   * Create an AuthManager instance for a specific user
   */
  static async createUserAuthManager(userId: string): Promise<AuthManager | null> {
    const tokens = await this.getUserTokens(userId);
    if (!tokens) {
      return null;
    }

    const config: MetaApiConfig = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      appId: process.env.META_APP_ID,
      appSecret: process.env.META_APP_SECRET,
      redirectUri: process.env.META_REDIRECT_URI,
      autoRefresh: true,
      apiVersion: process.env.META_API_VERSION,
      baseUrl: process.env.META_BASE_URL,
    };

    return new AuthManager(config);
  }

  /**
   * Delete user session and tokens
   */
  static async deleteUserData(userId: string): Promise<void> {
    const storage = this.getStorage();
    const sessionKey = `${this.SESSION_PREFIX}${userId}`;
    const tokenKey = `${this.TOKEN_PREFIX}${userId}`;
    
    await Promise.all([
      storage.del(sessionKey),
      storage.del(tokenKey)
    ]);
  }

  /**
   * Extract bearer token from Authorization header
   */
  static extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Authenticate user from request headers
   */
  static async authenticateUser(authHeader: string | null): Promise<UserSession | null> {
    const token = this.extractBearerToken(authHeader);
    if (!token) {
      return null;
    }

    const decoded = await this.verifySessionToken(token);
    if (!decoded) {
      return null;
    }

    return await this.getUserSession(decoded.userId);
  }

  /**
   * Generate OAuth state parameter with CSRF protection
   */
  static async generateOAuthState(): Promise<string> {
    const crypto = await import('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate OAuth state parameter
   */
  static async validateOAuthState(state: string, sessionState: string): Promise<boolean> {
    return state === sessionState;
  }

  /**
   * Generate Meta OAuth authorization URL
   */
  static generateMetaOAuthUrl(state: string): string {
    if (!process.env.META_APP_ID || !process.env.META_REDIRECT_URI) {
      throw new Error('META_APP_ID and META_REDIRECT_URI must be configured');
    }

    const scopes = [
      'ads_management',
      'ads_read',
      // 'business_management'
      // Note: 'read_insights' is included in ads_read
    ];

    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID,
      redirect_uri: process.env.META_REDIRECT_URI,
      scope: scopes.join(','),
      response_type: 'code',
      state: state,
    });

    const config_id = process.env.META_CONFIG_ID;
    if (config_id) {
      params.set("config_id", config_id);
    }

    return `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for access token
   */
  static async exchangeCodeForTokens(code: string): Promise<UserTokenData> {
    if (!process.env.META_APP_ID || !process.env.META_APP_SECRET || !process.env.META_REDIRECT_URI) {
      throw new Error('META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI must be configured');
    }

    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: process.env.META_REDIRECT_URI,
      code: code,
    });

    const response = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'bearer',
      expiresIn: data.expires_in,
      scope: [], // Meta doesn't return scope in token response
    };
  }

  /**
   * Get user info from Meta using access token
   */
  static async getMetaUserInfo(accessToken: string): Promise<{
    id: string;
    name: string;
    email: string;
  }> {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/me?fields=id,name,email&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    return await response.json();
  }

  /**
   * Refresh user's access token
   */
  static async refreshUserToken(userId: string): Promise<boolean> {
    const authManager = await this.createUserAuthManager(userId);
    if (!authManager) {
      return false;
    }

    try {
      const newToken = await authManager.refreshTokenIfNeeded();
      
      // Update stored tokens
      const tokens = await this.getUserTokens(userId);
      if (tokens) {
        tokens.accessToken = newToken;
        await this.storeUserTokens(userId, tokens);
      }
      
      return true;
    } catch (error) {
      console.error('Token refresh failed for user:', userId, error);
      return false;
    }
  }
}