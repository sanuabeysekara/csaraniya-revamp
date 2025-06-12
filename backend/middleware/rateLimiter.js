const rateLimit = require('express-rate-limit');
const config = require('../config/config');

// Custom memory store with automatic cleanup to prevent memory overflow
class MemoryStoreWithCleanup {
  constructor(options = {}) {
    this.hits = new Map();
    this.resetTime = new Map();
    this.maxHits = options.maxHits || config.rateLimit.maxHits;
    this.windowMs = options.windowMs || config.rateLimit.windowMs;
    this.cleanupInterval = options.cleanupInterval || config.rateLimit.cleanupInterval;
    this.maxMemoryUsage = options.maxMemoryUsage || 100 * 1024 * 1024; // 100MB
    this.emergencyCleanupThreshold = options.emergencyCleanupThreshold || 0.9; // 90%
    
    // Start cleanup interval
    this.startCleanup();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
  }

  startCleanup() {
    // Clean up expired entries every cleanup interval
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);

    // Emergency cleanup when memory usage gets too high
    setInterval(() => {
      if (this.hits.size > this.maxHits) {
        this.emergencyCleanup();
      }
    }, 30000); // Check every 30 seconds
  }

  startMemoryMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const usageRatio = memUsage.heapUsed / memUsage.heapTotal;
      
      if (usageRatio > this.emergencyCleanupThreshold) {
        console.warn('High memory usage detected, performing emergency cleanup');
        this.emergencyCleanup();
      }
    }, 30000); // Check every 30 seconds
  }

  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, resetTime] of this.resetTime.entries()) {
      if (now > resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.hits.delete(key);
      this.resetTime.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log(`Rate limiter cleanup: Removed ${keysToDelete.length} expired entries`);
    }
  }

  emergencyCleanup() {
    // If we're still over the limit, remove the oldest entries
    const entries = Array.from(this.resetTime.entries());
    entries.sort((a, b) => a[1] - b[1]); // Sort by reset time (oldest first)
    
    const toRemove = Math.floor(this.hits.size * 0.3); // Remove 30% of entries
    const keysToDelete = entries.slice(0, toRemove).map(entry => entry[0]);
    
    keysToDelete.forEach(key => {
      this.hits.delete(key);
      this.resetTime.delete(key);
    });

    console.log(`Rate limiter emergency cleanup: Removed ${keysToDelete.length} entries to prevent memory overflow`);
  }

  incr(key, cb) {
    const now = Date.now();
    const resetTime = this.resetTime.get(key);

    // If key doesn't exist or has expired, create/reset it
    if (!resetTime || now > resetTime) {
      this.hits.set(key, 1);
      this.resetTime.set(key, now + this.windowMs);
      return cb(null, { totalHits: 1, resetTime: new Date(now + this.windowMs) });
    }

    // Increment existing key
    const currentHits = this.hits.get(key) || 0;
    const newHits = currentHits + 1;
    this.hits.set(key, newHits);

    cb(null, { totalHits: newHits, resetTime: new Date(resetTime) });
  }

  decrement(key) {
    const currentHits = this.hits.get(key);
    if (currentHits && currentHits > 0) {
      this.hits.set(key, currentHits - 1);
    }
  }

  resetKey(key) {
    this.hits.delete(key);
    this.resetTime.delete(key);
  }

  resetAll() {
    this.hits.clear();
    this.resetTime.clear();
  }

  getStats() {
    return {
      totalKeys: this.hits.size,
      memoryUsage: process.memoryUsage(),
      oldestEntry: Math.min(...Array.from(this.resetTime.values())),
      newestEntry: Math.max(...Array.from(this.resetTime.values()))
    };
  }
}

// Create memory store instance
const memoryStore = new MemoryStoreWithCleanup();

// General API rate limiter with memory management
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Use shorter, more efficient keys
    const ip = req.ip || 'unknown';
    const userId = req.user?._id?.toString().slice(-8) || ''; // Last 8 chars of user ID
    return userId ? `${ip}:${userId}` : ip;
  },
  store: memoryStore
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Use mobile number for more accurate tracking
    const mobile = req.body?.mobileNumber?.slice(-8) || req.ip; // Last 8 digits
    return `auth:${mobile}`;
  },
  store: new MemoryStoreWithCleanup({ maxHits: 5000 }) // Smaller store for auth
});

// OTP rate limiter - very strict
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait before requesting another OTP.',
    retryAfter: 1
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    const mobile = req.body?.mobileNumber?.slice(-8) || req.ip;
    return `otp:${mobile}`;
  },
  store: new MemoryStoreWithCleanup({ maxHits: 1000 }) // Very small store for OTP
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const mobile = req.body?.mobileNumber?.slice(-8) || req.ip;
    return `reset:${mobile}`;
  },
  store: new MemoryStoreWithCleanup({ maxHits: 2000 })
});

// Registration rate limiter
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `reg:${req.ip}`,
  store: new MemoryStoreWithCleanup({ maxHits: 1000 })
});

// Login rate limiter per mobile number
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const mobile = req.body?.mobileNumber?.slice(-8) || req.ip;
    return `login:${mobile}`;
  },
  store: new MemoryStoreWithCleanup({ maxHits: 3000 })
});

// Very strict limiter for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Rate limit exceeded for sensitive operation. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    const userId = req.user?._id?.toString().slice(-8) || '';
    return `strict:${userId ? `${ip}:${userId}` : ip}`;
  },
  store: new MemoryStoreWithCleanup({ maxHits: 500 })
});

// Custom rate limiter factory
const createCustomLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000 / 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => {
      const ip = req.ip || 'unknown';
      const userId = req.user?._id?.toString().slice(-8) || '';
      return userId ? `${ip}:${userId}` : ip;
    },
    store: new MemoryStoreWithCleanup({ maxHits: options.maxHits || 5000 })
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Cleanup function for graceful shutdown
const cleanup = () => {
  console.log('Cleaning up rate limiter stores...');
  memoryStore.resetAll();
};

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

module.exports = {
  generalLimiter,
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
  registrationLimiter,
  loginLimiter,
  strictLimiter,
  createCustomLimiter,
  cleanup,
  memoryStore
}; 