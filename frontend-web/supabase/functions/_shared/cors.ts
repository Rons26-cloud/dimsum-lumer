const PRODUCTION_ORIGIN = 'https://dimsum-lumerr.pages.dev';

const allowedOrigins = () => {
  const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',');
  const frontendOrigin = Deno.env.get('FRONTEND_URL') || '';

  return new Set(
    [PRODUCTION_ORIGIN, frontendOrigin, ...configuredOrigins]
      .map((value) => value.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );
};

export const corsHeaders = (request: Request) => {
  const origin = request.headers.get('origin')?.replace(/\/$/, '') || '';
  const allowed = allowedOrigins();
  const hostname = (() => {
    try { return new URL(origin).hostname; } catch { return ''; }
  })();
  const isLocalDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  const acceptedOrigin = origin && (allowed.has(origin) || isLocalDevelopment) ? origin : '';
  return {
    ...(acceptedOrigin ? { 'Access-Control-Allow-Origin': acceptedOrigin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
};

export const assertAllowedOrigin = (request: Request) => {
  const origin = request.headers.get('origin');
  // Server-to-server webhooks and native applications normally send no Origin.
  if (!origin) return;
  const normalizedOrigin = origin.replace(/\/$/, '');
  const hostname = (() => {
    try { return new URL(normalizedOrigin).hostname; } catch { return ''; }
  })();
  // Local Vite ports are safe for development. Production origins must still
  // be explicitly listed in ALLOWED_ORIGINS.
  const isLocalDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (!isLocalDevelopment && !allowedOrigins().has(normalizedOrigin)) {
    throw new Error('ORIGIN_NOT_ALLOWED');
  }
};

export const officialFrontendOrigin = () => {
  const configured = Deno.env.get('FRONTEND_URL')?.trim().replace(/\/$/, '');
  if (!configured) throw new Error('FRONTEND_URL_NOT_CONFIGURED');
  const url = new URL(configured);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error('FRONTEND_URL_INVALID');
  }
  return url.origin;
};
