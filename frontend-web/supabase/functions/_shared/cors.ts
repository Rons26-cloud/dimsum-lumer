const allowedOrigins = () => new Set(
  (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean),
);

export const corsHeaders = (request: Request) => {
  const origin = request.headers.get('origin')?.replace(/\/$/, '') || '';
  const allowed = allowedOrigins();
  const acceptedOrigin = origin && allowed.has(origin) ? origin : '';
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
  if (!allowedOrigins().has(origin.replace(/\/$/, ''))) {
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
