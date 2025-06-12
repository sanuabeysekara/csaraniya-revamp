# Csaraniya Backend API

A complete backend API for the Csaraniya course selling platform with comprehensive user management, authentication, and security features.

## 🌟 Features

### 🔐 Authentication & Security
- Complete user registration and login system
- Mobile number verification with OTP
- Password reset functionality
- JWT-based authentication with refresh tokens
- Single device login restriction
- Account locking after failed attempts
- Rate limiting with memory-optimized stores
- Input validation and sanitization
- Session management with device tracking

### 👤 User Management
- User profiles with complete information
- Mobile number authentication
- Role-based access control (Student, Admin, Support)
- Account status management
- Device trust management
- Password change tracking

### 📱 SMS Integration
- OTP generation and delivery
- Multiple OTP types (registration, login, password reset)
- SMS gateway integration
- Message templates for different scenarios

### 🛡️ Security Features
- Helmet.js for security headers
- CORS configuration
- Request size limiting
- Memory-efficient rate limiting without Redis
- Comprehensive error handling
- Logging and monitoring

## 🏗️ Architecture

### Clean Code Structure
```
backend/
├── config/           # Configuration files
├── controllers/      # Business logic controllers
├── middleware/       # Custom middleware
├── models/          # Database models
├── routes/          # API route definitions
├── utils/           # Utility functions
└── server.js        # Main application entry
```

### Rate Limiting Architecture
- **Memory-optimized stores** with automatic cleanup
- **Emergency cleanup** mechanisms to prevent memory overflow
- **Configurable limits** per endpoint type
- **Graceful degradation** under high load
- **No Redis dependency** - pure memory management

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- SMS Gateway API credentials

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d

# SMS Gateway
SMS_API_URL=https://your-sms-gateway.com/api/send
SMS_API_KEY=your_sms_api_key
SMS_FROM_NUMBER=+1234567890

# Security
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME=300000

# OTP Configuration
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_MAX_HITS=10000
RATE_LIMIT_RESET_TIME=3600000
RATE_LIMIT_CLEANUP_INTERVAL=300000
```

### Installation Steps

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Start production server**
```bash
npm start
```

## 📊 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/register` | Register new user | 3/hour |
| POST | `/verify-registration` | Verify mobile number | 10/15min |
| POST | `/login` | User login | 5/15min |
| POST | `/logout` | User logout | Protected |
| POST | `/forgot-password` | Request password reset | 5/hour |
| POST | `/reset-password` | Reset password with OTP | 5/hour |
| GET | `/profile` | Get user profile | Protected |
| PUT | `/profile` | Update user profile | Protected |

### System Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api` | API documentation |

## 💾 Database Schema

### Users Collection
```javascript
{
  mobileNumber: String,        // Primary identifier
  password: String,            // Hashed password
  mobileVerified: Boolean,     // Verification status
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String,
    preferredLanguage: String,
    address: { ... }
  },
  role: String,               // student/admin/support
  status: {
    isActive: Boolean,
    lastActiveAt: Date
  },
  security: {
    loginAttempts: Number,
    lockUntil: Date,
    lastLoginAt: Date,
    lastLoginIP: String,
    currentSession: { ... },
    trustedDevices: [...]
  }
}
```

### OTP Verifications Collection
```javascript
{
  mobileNumber: String,
  hashedOTP: String,
  otpType: String,           // registration/password_reset/etc
  expiresAt: Date,
  attempts: Number,
  maxAttempts: Number,
  isUsed: Boolean,
  deviceInfo: { ... }
}
```

## 🔒 Security Features

### Rate Limiting
- **Memory-optimized stores** with automatic cleanup
- **Per-endpoint limits** based on sensitivity
- **IP and user-based tracking**
- **Graceful error messages**
- **Emergency cleanup** to prevent memory overflow

### Authentication
- **JWT tokens** with short expiration
- **Refresh token** rotation
- **Device-based session management**
- **Single device login** enforcement
- **Account locking** mechanism

### Input Validation
- **Joi schema validation**
- **Mobile number format validation**
- **Password strength requirements**
- **Request sanitization**

## 🚀 Memory Management

### Rate Limiter Optimization
- **Custom memory store** with cleanup intervals
- **Automatic expired entry removal**
- **Emergency cleanup** when limits exceeded
- **Memory usage monitoring**
- **Configurable cleanup thresholds**

### Monitoring
- **Memory usage tracking** every 10 minutes
- **Garbage collection triggers** for high usage
- **Graceful shutdown** with cleanup
- **Process signal handling**

## 🔧 Configuration

### Rate Limiting Settings
```javascript
{
  windowMs: 900000,           // 15 minutes
  maxRequests: 100,           // General limit
  maxHits: 10000,            // Memory store limit
  resetTime: 3600000,        // 1 hour reset
  cleanupInterval: 300000    // 5 minute cleanup
}
```

### Security Configuration
```javascript
{
  bcryptSaltRounds: 12,
  maxLoginAttempts: 5,
  accountLockTime: 300000,   // 5 minutes
  otpExpiryMinutes: 5,
  otpMaxAttempts: 3
}
```

## 🐛 Error Handling

### Comprehensive Error Management
- **Global error handler** with specific error types
- **Validation error** formatting
- **MongoDB error** handling
- **JWT error** management
- **Rate limiting** error responses
- **CORS error** handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed errors array"],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📈 Performance Optimization

### Memory Management
- **Efficient key generation** for rate limiting
- **Automatic cleanup** of expired entries
- **Memory usage monitoring**
- **Garbage collection** optimization
- **Process optimization** for high load

### Caching Strategy
- **JWT payload optimization**
- **Efficient user lookups**
- **Session state management**
- **Device info caching**

## 🔄 Development Workflow

### Code Structure
- **Controllers** contain all business logic
- **Routes** only handle middleware and controller calls
- **Middleware** handles cross-cutting concerns
- **Utils** provide reusable functionality
- **Models** define data structure and validation

### Best Practices
- **Separation of concerns**
- **Error handling** at every level
- **Input validation** before processing
- **Logging** for debugging and monitoring
- **Clean code** principles

## 🚀 Deployment

### Production Considerations
- Set `NODE_ENV=production`
- Use process manager (PM2)
- Configure proper CORS origins
- Set up MongoDB connection pooling
- Enable compression middleware
- Configure proper logging levels

### Environment Setup
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "csaraniya-api"

# Monitor
pm2 logs csaraniya-api
pm2 monit
```

## 📚 API Documentation

Visit `/api` endpoint when the server is running to see complete API documentation with all available endpoints and their specifications.

## 🔐 Authentication Flow

1. **Registration**: POST `/api/auth/register`
2. **OTP Verification**: POST `/api/auth/verify-registration`
3. **Login**: POST `/api/auth/login`
4. **Access Protected Routes**: Include `Authorization: Bearer <token>`
5. **Logout**: POST `/api/auth/logout`

## 🔧 Troubleshooting

### Common Issues
- **Memory overflow**: Check rate limiter cleanup settings
- **Authentication errors**: Verify JWT secrets and token format
- **OTP delivery**: Check SMS gateway configuration
- **Database connection**: Verify MongoDB URI and network
- **CORS errors**: Check allowed origins configuration

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` and checking console outputs for detailed error information.

---

## 📞 Support

For technical support or questions about the Csaraniya backend API, please check the API documentation at `/api` endpoint or review the error logs for detailed debugging information. 