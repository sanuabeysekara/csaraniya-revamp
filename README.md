# Csaraniya Course Selling Platform

A comprehensive course selling platform with robust authentication, admin management, and student management systems.

## 🚀 Features

### Student Features
- **Mobile-based Registration** with SMS OTP verification
- **Secure Authentication** with JWT tokens and device management
- **Password Reset** via SMS OTP
- **Profile Management** with comprehensive user data
- **Multi-language Support** (English, Sinhala, Tamil)

### Admin Features
- **Role-based Access Control** (Super Admin, Admin, Support)
- **Dashboard Analytics** with comprehensive statistics
- **Student Management** with activation/deactivation capabilities
- **Admin User Management** with hierarchical permissions
- **Password Reset Management** (Admin-controlled, no self-service)
- **Session Management** with device tracking

## 🔐 Admin Password Reset System

### Key Design Principles
- **No Self-Service**: Admin users cannot reset their own passwords
- **Hierarchical Control**: Only higher-privilege users can reset passwords
- **Audit Trail**: All password resets are logged with reasons
- **Session Termination**: All active sessions are terminated after password reset

### Permission Matrix

| Requester Role | Can Reset Password For | Notes |
|----------------|------------------------|-------|
| **Super Admin** | Admin, Support | Cannot reset own password |
| **Admin** | Support only | Cannot reset Admin or Super Admin passwords |
| **Support** | None | Cannot reset any passwords |

### API Endpoints

#### Reset Admin Password
```http
PUT /api/admin/admins/:adminId/reset-password
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "newPassword": "NewSecurePassword123!",
  "reason": "Password reset requested due to security concern"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin password reset successfully",
  "data": {
    "adminId": "admin_id",
    "username": "admin_username",
    "email": "admin@example.com",
    "role": "admin",
    "passwordResetAt": "2024-01-15T10:30:00.000Z",
    "resetBy": {
      "id": "super_admin_id",
      "username": "superadmin",
      "role": "super_admin"
    },
    "reason": "Password reset requested due to security concern",
    "sessionsTerminated": true
  }
}
```

#### Update Admin Status
```http
PUT /api/admin/admins/:adminId/status
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "isActive": false,
  "reason": "Account suspended for policy violation"
}
```

## 🏗️ Architecture

### Authentication Flow
```
Student Registration → SMS OTP → Mobile Verification → JWT Token
Admin Login → Credentials → JWT Token + Session Management
```

### Role Hierarchy
```
Super Admin (Full Access)
    ├── Admin (User Management + Limited Admin Management)
    └── Support (Read-only Access)
```

### Security Features
- **Rate Limiting**: Prevents brute force attacks
- **Account Locking**: Temporary lockout after failed attempts
- **Session Management**: Device-based session tracking
- **Password Policies**: Strong password requirements
- **Audit Logging**: Comprehensive activity tracking

## 📁 Project Structure

```
backend/
├── controllers/
│   ├── authController.js      # Student authentication
│   └── adminController.js     # Admin management
├── models/
│   ├── User.js               # Student model
│   └── Admin.js              # Admin model
├── routes/
│   ├── auth.js               # Student routes
│   └── admin.js              # Admin routes
├── middleware/
│   ├── auth.js               # Authentication middleware
│   ├── rateLimiter.js        # Rate limiting
│   └── deviceInfo.js         # Device tracking
├── utils/
│   ├── jwt.js                # JWT utilities
│   ├── validation.js         # Input validation
│   └── sms.js                # SMS service
└── config/
    └── config.js             # Configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- SMS Gateway credentials (for OTP)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd csaraniya
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/csaraniya

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin JWT Configuration
ADMIN_JWT_SECRET=your-admin-jwt-secret
ADMIN_JWT_EXPIRES_IN=1h
ADMIN_JWT_REFRESH_EXPIRES_IN=30d

# Super Admin Setup
SUPER_ADMIN_SETUP_KEY=SUPER_ADMIN_SETUP_2024
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_EMAIL=superadmin@csaraniya.com

# SMS Configuration
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-api-secret
SMS_SENDER_ID=CSARANIYA

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing with Postman

### Setup
1. Import `Csaraniya_API_Collection.postman_collection.json`
2. Import `Csaraniya_Environment.postman_environment.json`
3. Update environment variables as needed

### Test Scenarios

#### Admin Password Reset Testing
1. **Setup Super Admin** - Create initial super admin account
2. **Admin Login** - Login with super admin credentials
3. **Create Admin User** - Create a test admin user
4. **Get All Admins** - List all admin users (auto-selects target)
5. **Reset Admin Password** - Reset password for target admin
6. **Verify Session Termination** - Confirm all sessions are terminated

#### Permission Testing
- Test admin trying to reset super admin password (should fail)
- Test support user trying to reset any password (should fail)
- Test admin resetting support user password (should succeed)

## 📊 API Documentation

### Student Endpoints
- `POST /api/auth/register` - Register new student
- `POST /api/auth/verify-registration` - Verify mobile number
- `POST /api/auth/login` - Student login
- `POST /api/auth/logout` - Student logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `GET /api/auth/profile` - Get student profile
- `PUT /api/auth/profile` - Update student profile

### Admin Endpoints
- `POST /api/admin/setup-super-admin` - One-time super admin setup
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/profile` - Get admin profile
- `GET /api/admin/dashboard` - Dashboard statistics
- `POST /api/admin/create-admin` - Create new admin user
- `GET /api/admin/admins` - List all admin users
- `PUT /api/admin/admins/:id/reset-password` - Reset admin password
- `PUT /api/admin/admins/:id/status` - Update admin status
- `GET /api/admin/students` - List all students
- `PUT /api/admin/students/:id/status` - Update student status

## 🔒 Security Considerations

### Password Reset Security
- **No Token-based Reset**: Eliminates token interception risks
- **Immediate Effect**: Password changes take effect immediately
- **Session Invalidation**: All existing sessions are terminated
- **Audit Trail**: Complete logging of who reset what and why
- **Permission Validation**: Strict role-based access control

### General Security
- **Input Validation**: Comprehensive validation using Joi
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Proper cross-origin request handling
- **Helmet Integration**: Security headers for production
- **Environment Separation**: Different configs for dev/prod

## 🚨 Important Notes

### Admin Password Reset
- **Self-Reset Disabled**: Admin users cannot reset their own passwords
- **Contact Policy**: If an admin forgets their password, they must contact a super admin
- **Emergency Access**: Ensure multiple super admin accounts exist
- **Reason Required**: All password resets must include a reason for audit purposes

### Production Deployment
- Change all default passwords and secrets
- Enable HTTPS/TLS encryption
- Configure proper CORS origins
- Set up monitoring and logging
- Implement backup strategies
- Configure SMS gateway properly

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository. 