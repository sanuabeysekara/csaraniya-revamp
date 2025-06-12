require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb+srv://sanuabeysekara:n8750BqcNT03TbvJ@csaraniyac1.iaqr1zd.mongodb.net/?retryWrites=true&w=majority&appName=CsaraniyaC1'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'csaraniya-super-secret-jwt-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'csaraniya-refresh-token-secret-2024',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    // Admin JWT settings
    adminSecret: process.env.JWT_ADMIN_SECRET || 'csaraniya-admin-secret-jwt-key-2024',
    adminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '8h',
    adminRefreshSecret: process.env.JWT_ADMIN_REFRESH_SECRET || 'csaraniya-admin-refresh-secret-2024',
    adminRefreshExpiresIn: process.env.JWT_ADMIN_REFRESH_EXPIRES_IN || '24h'
  },
  sms: {
    apiUrl: process.env.SMS_API_URL || 'https://your-sms-gateway.com/api/send',
    apiKey: process.env.SMS_API_KEY || 'your-sms-api-key',
    fromNumber: process.env.SMS_FROM_NUMBER || '+1234567890'
  },
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    accountLockTime: parseInt(process.env.ACCOUNT_LOCK_TIME) || 300000
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    // Memory management settings
    maxHits: parseInt(process.env.RATE_LIMIT_MAX_HITS) || 10000, // Maximum number of hits to store in memory
    resetTime: parseInt(process.env.RATE_LIMIT_RESET_TIME) || 3600000, // 1 hour - when to reset the entire store
    cleanupInterval: parseInt(process.env.RATE_LIMIT_CLEANUP_INTERVAL) || 300000 // 5 minutes - cleanup interval
  },
  superAdmin: {
    username: process.env.SUPER_ADMIN_USERNAME || 'superadmin',
    password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2024!',
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@csaraniya.com',
    setupKey: process.env.SUPER_ADMIN_SETUP_KEY || 'csaraniya-super-admin-setup-key-2024',
    enabled: process.env.SUPER_ADMIN_ENABLED === 'true' || true
  },
  admin: {
    sessionTimeout: parseInt(process.env.ADMIN_SESSION_TIMEOUT) || 28800000, // 8 hours
    maxConcurrentSessions: parseInt(process.env.ADMIN_MAX_CONCURRENT_SESSIONS) || 3,
    passwordResetExpiry: parseInt(process.env.ADMIN_PASSWORD_RESET_EXPIRY) || 3600000 // 1 hour
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ]
  }
}; 