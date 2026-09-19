import 'dotenv/config';

function required(name, { allowEmpty = false } = {}) {
  const value = process.env[name];
  if (value === undefined || (!allowEmpty && String(value).trim() === '')) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

const nodeEnv = optional('NODE_ENV', 'development');
const isProd = nodeEnv === 'production';
const isNetlify = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Fail fast on secrets in production; allow documented defaults in development
const jwtAccessSecret = isProd
  ? required('JWT_ACCESS_SECRET')
  : optional('JWT_ACCESS_SECRET', 'dev-only-access-secret-change-me-32c');
const jwtRefreshSecret = isProd
  ? required('JWT_REFRESH_SECRET')
  : optional('JWT_REFRESH_SECRET', 'dev-only-refresh-secret-change-me-32');

if (isProd) {
  required('DATABASE_URL');
}

export const env = {
  nodeEnv,
  isProd,
  isNetlify,
  port: Number(optional('PORT', '5000')),
  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),
  databaseUrl: optional(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/ecomm?schema=public'
  ),
  jwtAccessSecret,
  jwtRefreshSecret,
  jwtAccessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  cookieSecure: optional('COOKIE_SECURE', isProd ? 'true' : 'false') === 'true',
  taxRate: Number(optional('TAX_RATE', '0.08')),
  shippingFlatRate: Number(optional('SHIPPING_FLAT_RATE', '5.99')),
  freeShippingThreshold: Number(optional('FREE_SHIPPING_THRESHOLD', '75')),
  stripeSecretKey: optional('STRIPE_SECRET_KEY', ''),
  stripeWebhookSecret: optional('STRIPE_WEBHOOK_SECRET', ''),
  stripeCurrency: optional('STRIPE_CURRENCY', 'usd'),
  uploadDir: optional('UPLOAD_DIR', 'uploads'),
  maxUploadSizeMb: Number(optional('MAX_UPLOAD_SIZE_MB', '5')),
  emailFrom: optional('EMAIL_FROM', 'noreply@ecomm.local'),
};
