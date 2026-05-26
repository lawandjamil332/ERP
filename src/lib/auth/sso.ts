/**
 * SSO scaffolding — OIDC / SAML.
 *
 * Production-grade SSO requires per-tenant Identity Provider (IdP) config:
 *   - OIDC: issuer URL, client_id, client_secret
 *   - SAML: metadata XML, certificate fingerprint
 *
 * This module provides:
 *   - PKCE-based OIDC authorization-code flow helpers
 *   - JWT-id_token verification (using `jose` already in deps)
 *   - SAML response stub (full lib swap-in: @node-saml/node-saml)
 *
 * To enable: store per-tenant config in a SsoProvider table (TODO), set
 * SSO_BASE_URL = `${APP_URL}/api/auth/sso`, and the redirect routes will work.
 */

import { createHash, randomBytes } from 'crypto';
import { jwtVerify, createRemoteJWKSet } from 'jose';

export interface OidcStart {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
  nonce: string;
}

export function startOidc(args: {
  issuer: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
}): OidcStart {
  const state = randomBytes(16).toString('hex');
  const nonce = randomBytes(16).toString('hex');
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const url = new URL(`${args.issuer.replace(/\/$/, '')}/protocol/openid-connect/auth`);
  url.searchParams.set('client_id', args.clientId);
  url.searchParams.set('redirect_uri', args.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', args.scope ?? 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return { authorizationUrl: url.toString(), state, codeVerifier, nonce };
}

export async function completeOidc(args: {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<{ accessToken: string; idToken: string; refreshToken?: string; claims: any }> {
  const tokenUrl = `${args.issuer.replace(/\/$/, '')}/protocol/openid-connect/token`;
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code: args.code,
    client_id: args.clientId,
    client_secret: args.clientSecret,
    redirect_uri: args.redirectUri,
    code_verifier: args.codeVerifier,
  });
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`token_exchange_failed_${res.status}`);
  const body = await res.json();
  const jwks = createRemoteJWKSet(new URL(`${args.issuer.replace(/\/$/, '')}/protocol/openid-connect/certs`));
  const { payload } = await jwtVerify(body.id_token, jwks, { audience: args.clientId });
  return {
    accessToken: body.access_token,
    idToken: body.id_token,
    refreshToken: body.refresh_token,
    claims: payload,
  };
}

/** SAML response handler — stub. For production swap in @node-saml/node-saml. */
export function parseSamlResponse(_base64Response: string): {
  email?: string; nameId?: string; attributes: Record<string, string>;
} {
  return { attributes: {} };
}
