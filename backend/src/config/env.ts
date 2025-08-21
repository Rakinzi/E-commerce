import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('localhost'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/ecommerce'),
  MONGODB_TEST_URI: z.string().default('mongodb://localhost:27017/ecommerce_test'),
  MONGODB_MAX_POOL_SIZE: z.string().transform(Number).default('10'),
  MONGODB_SERVER_SELECTION_TIMEOUT: z.string().transform(Number).default('5000'),
  MONGODB_SOCKET_TIMEOUT: z.string().transform(Number).default('45000'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  REDIS_MAX_RETRIES: z.string().transform(Number).default('3'),
  REDIS_RETRY_DELAY: z.string().transform(Number).default('100'),
  
  // JWT/Session
  JWT_SECRET: z.string().default('your-jwt-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SESSION_SECRET: z.string().default('your-session-secret-change-in-production'),
  SESSION_MAX_AGE: z.string().transform(Number).default('86400000'),
  SESSION_SECURE: z.string().transform((val) => val === 'true').default('false'),
  
  // CSRF
  CSRF_SECRET: z.string().default('your-csrf-secret-change-in-production'),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CORS_CREDENTIALS: z.string().transform((val) => val === 'true').default('true'),
  CORS_METHODS: z.string().default('GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
  CORS_ALLOWED_HEADERS: z.string().default('Content-Type,Authorization,X-Requested-With,Accept,Origin,X-CSRF-Token'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  AUTH_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('5'),
  REGISTER_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('3600000'),
  REGISTER_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('3'),
  
  // File uploads
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'), // 5MB
  UPLOAD_DIR: z.string().default('./uploads'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/gif,image/webp'),
  MAX_FILES_PER_REQUEST: z.string().transform(Number).default('10'),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z.string().transform((val) => val === 'true').default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@ecommerce.local'),
  FROM_EMAIL: z.string().default('noreply@ecommerce.local'),
  FROM_NAME: z.string().default('E-Commerce Platform'),
  
  // External Services
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.string().default('info'),
  LOG_FORMAT: z.string().default('combined'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),
  LOG_ERROR_FILE_PATH: z.string().default('./logs/error.log'),
  
  // Business Settings
  DEFAULT_ORDER_STATUS: z.string().default('pending'),
  ORDER_TIMEOUT_MINUTES: z.string().transform(Number).default('30'),
  DEFAULT_CURRENCY: z.string().default('USD'),
  TAX_RATE: z.string().transform(Number).default('0.08'),
  FREE_SHIPPING_THRESHOLD: z.string().transform(Number).default('50.00'),
  DEFAULT_SHIPPING_COST: z.string().transform(Number).default('10.00'),
  
  // Feature Flags
  FEATURE_REVIEWS_ENABLED: z.string().transform((val) => val === 'true').default('true'),
  FEATURE_WISHLIST_ENABLED: z.string().transform((val) => val === 'true').default('true'),
  FEATURE_NOTIFICATIONS_ENABLED: z.string().transform((val) => val === 'true').default('true'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);