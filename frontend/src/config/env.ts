// Environment configuration for the frontend application

interface EnvironmentConfig {
  // Application
  APP_NAME: string;
  APP_VERSION: string;
  NODE_ENV: string;
  
  // API
  API_BASE_URL: string;
  API_TIMEOUT: number;
  
  // Features
  FEATURE_REVIEWS: boolean;
  FEATURE_WISHLIST: boolean;
  FEATURE_NOTIFICATIONS: boolean;
  FEATURE_CHAT_SUPPORT: boolean;
  FEATURE_SOCIAL_LOGIN: boolean;
  FEATURE_GUEST_CHECKOUT: boolean;
  FEATURE_DARK_MODE: boolean;
  
  // UI Settings
  PRODUCTS_PER_PAGE: number;
  ORDERS_PER_PAGE: number;
  SEARCH_DEBOUNCE: number;
  ANIMATION_DURATION: number;
  TOAST_DURATION: number;
  
  // Business
  FREE_SHIPPING_THRESHOLD: number;
  DEFAULT_SHIPPING_COST: number;
  TAX_RATE: number;
  CURRENCY_SYMBOL: string;
  
  // Development
  DEBUG_MODE: boolean;
  REACT_QUERY_DEVTOOLS: boolean;
  
  // External Services
  STRIPE_PUBLISHABLE_KEY?: string;
  GOOGLE_ANALYTICS_ID?: string;
  SENTRY_DSN?: string;
}

// Helper function to get environment variable with fallback
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

// Helper function to get boolean environment variable
const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

// Helper function to get number environment variable
const getEnvNumber = (key: string, defaultValue: number = 0): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Environment configuration object
export const env: EnvironmentConfig = {
  // Application
  APP_NAME: getEnvVar('VITE_APP_NAME', 'E-Commerce Platform'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  NODE_ENV: import.meta.env.MODE || 'development',
  
  // API
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000/api/v1'),
  API_TIMEOUT: getEnvNumber('VITE_API_TIMEOUT', 30000),
  
  // Features
  FEATURE_REVIEWS: getEnvBoolean('VITE_FEATURE_REVIEWS', true),
  FEATURE_WISHLIST: getEnvBoolean('VITE_FEATURE_WISHLIST', true),
  FEATURE_NOTIFICATIONS: getEnvBoolean('VITE_FEATURE_NOTIFICATIONS', true),
  FEATURE_CHAT_SUPPORT: getEnvBoolean('VITE_FEATURE_CHAT_SUPPORT', false),
  FEATURE_SOCIAL_LOGIN: getEnvBoolean('VITE_FEATURE_SOCIAL_LOGIN', false),
  FEATURE_GUEST_CHECKOUT: getEnvBoolean('VITE_FEATURE_GUEST_CHECKOUT', true),
  FEATURE_DARK_MODE: getEnvBoolean('VITE_FEATURE_DARK_MODE', false),
  
  // UI Settings
  PRODUCTS_PER_PAGE: getEnvNumber('VITE_PRODUCTS_PER_PAGE', 12),
  ORDERS_PER_PAGE: getEnvNumber('VITE_ORDERS_PER_PAGE', 10),
  SEARCH_DEBOUNCE: getEnvNumber('VITE_SEARCH_DEBOUNCE', 500),
  ANIMATION_DURATION: getEnvNumber('VITE_ANIMATION_DURATION', 300),
  TOAST_DURATION: getEnvNumber('VITE_TOAST_DURATION', 5000),
  
  // Business
  FREE_SHIPPING_THRESHOLD: getEnvNumber('VITE_FREE_SHIPPING_THRESHOLD', 50.00),
  DEFAULT_SHIPPING_COST: getEnvNumber('VITE_DEFAULT_SHIPPING_COST', 10.00),
  TAX_RATE: getEnvNumber('VITE_TAX_RATE', 0.08),
  CURRENCY_SYMBOL: getEnvVar('VITE_CURRENCY_SYMBOL', '$'),
  
  // Development
  DEBUG_MODE: getEnvBoolean('VITE_DEBUG_MODE', import.meta.env.MODE === 'development'),
  REACT_QUERY_DEVTOOLS: getEnvBoolean('VITE_REACT_QUERY_DEVTOOLS', import.meta.env.MODE === 'development'),
  
  // External Services
  STRIPE_PUBLISHABLE_KEY: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY'),
  GOOGLE_ANALYTICS_ID: getEnvVar('VITE_GOOGLE_ANALYTICS_ID'),
  SENTRY_DSN: getEnvVar('VITE_SENTRY_DSN'),
};

// Validation function to check required environment variables
export const validateEnvironment = (): void => {
  const requiredVars = [
    'API_BASE_URL',
  ];
  
  const missingVars = requiredVars.filter(varName => {
    const value = env[varName as keyof EnvironmentConfig];
    return !value || (typeof value === 'string' && value.trim() === '');
  });
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
};

// Helper function to check if we're in development mode
export const isDevelopment = (): boolean => {
  return env.NODE_ENV === 'development';
};

// Helper function to check if we're in production mode
export const isProduction = (): boolean => {
  return env.NODE_ENV === 'production';
};

// Helper function to check if we're in test mode
export const isTest = (): boolean => {
  return env.NODE_ENV === 'test';
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${env.API_BASE_URL}/${cleanEndpoint}`;
};

// Debug logging function (only logs in development)
export const debugLog = (message: string, data?: any): void => {
  if (env.DEBUG_MODE) {
    console.log(`[${env.APP_NAME}] ${message}`, data || '');
  }
};

// Initialize environment validation on module load
if (typeof window !== 'undefined') {
  try {
    validateEnvironment();
    debugLog('Environment configuration loaded successfully', {
      NODE_ENV: env.NODE_ENV,
      API_BASE_URL: env.API_BASE_URL,
      APP_VERSION: env.APP_VERSION,
    });
  } catch (error) {
    console.error('Environment validation failed:', error);
  }
}

export default env;