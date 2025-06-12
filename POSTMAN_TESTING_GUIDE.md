# Csaraniya API Testing Guide

This guide provides comprehensive instructions for testing the Csaraniya course selling platform API using Postman.

## 📋 Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Environment Configuration](#environment-configuration)
3. [Testing Workflows](#testing-workflows)
4. [Student API Testing](#student-api-testing)
5. [Admin API Testing](#admin-api-testing)
6. [Error Scenarios](#error-scenarios)
7. [Rate Limiting](#rate-limiting)
8. [Newman CLI Testing](#newman-cli-testing)
9. [Troubleshooting](#troubleshooting)

## 🚀 Setup Instructions

### Prerequisites
- Postman installed (Desktop or Web version)
- Csaraniya backend server running on `http://localhost:3000`
- MongoDB database connected and running

### Import Collection and Environment

1. **Import Collection:**
   - Open Postman
   - Click "Import" button
   - Select `Csaraniya_API_Collection.postman_collection.json`
   - Click "Import"

2. **Import Environment:**
   - Click "Import" button
   - Select `Csaraniya_API_Environment.postman_environment.json`
   - Click "Import"

3. **Select Environment:**
   - Click the environment dropdown (top right)
   - Select "Csaraniya API Environment"

## ⚙️ Environment Configuration

### Required Variables

The environment includes the following key variables:

#### Server Configuration
- `base_url`: API base URL (default: `http://localhost:3000`)
- `api_version`: API version (default: `v1`)

#### Student Testing Variables
- `student_mobile_number`: Test mobile number (default: `+94771234567`)
- `student_password`: Test password (default: `TestPassword123!`)
- `student_first_name`: First name (default: `Test`)
- `student_last_name`: Last name (default: `Student`)
- `registration_otp`: OTP for verification (update with actual OTP)
- `password_reset_otp`: OTP for password reset (update with actual OTP)

#### Admin Testing Variables
- `super_admin_setup_key`: Setup key (default: `csaraniya-super-admin-setup-2024`)
- `super_admin_username`: Super admin username (default: `superadmin`)
- `super_admin_email`: Super admin email (default: `superadmin@csaraniya.com`)
- `super_admin_password`: Super admin password (default: `SuperAdmin123!`)
- `new_admin_username`: New admin username (default: `testadmin`)
- `new_admin_email`: New admin email (default: `testadmin@csaraniya.com`)
- `new_admin_password`: New admin password (default: `TestAdmin123!`)

#### Auto-Generated Variables
These are automatically populated during testing:
- `device_id`, `admin_device_id`: Device identifiers
- `student_access_token`, `admin_access_token`: Authentication tokens
- `student_id`, `super_admin_id`: User IDs
- `test_student_id`: For admin operations testing

## 🧪 Testing Workflows

### Complete Student Journey

1. **Registration Flow:**
   ```
   Register Student → Resend Registration OTP (if needed) → Verify Registration
   ```

2. **Authentication Flow:**
   ```
   Student Login → Access Protected Endpoints → Student Logout
   ```

3. **Password Reset Flow:**
   ```
   Forgot Password → Resend Forgot Password OTP (if needed) → Reset Password
   ```

4. **Profile Management:**
   ```
   Get Profile → Update Profile
   ```

### Complete Admin Journey

1. **Initial Setup:**
   ```
   Setup Super Admin (one-time)
   ```

2. **Admin Authentication:**
   ```
   Admin Login → Access Admin Endpoints → Admin Logout
   ```

3. **Admin Management:**
   ```
   Get Admin Profile → Get Dashboard Stats → Create Admin User → Get All Admins
   ```

4. **Student Management:**
   ```
   Get All Students → Search Students → Update Student Status
   ```

## 👨‍🎓 Student API Testing

### 1. Student Registration

**Endpoint:** `POST /api/auth/register`

**Test Steps:**
1. Run "Register Student" request
2. Check response for success and user ID
3. Note: OTP will be sent to the mobile number (check SMS gateway logs)

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your mobile number.",
  "data": {
    "userId": "user_id_here",
    "mobileNumber": "+94771234567",
    "otpSent": true
  }
}
```

### 2. OTP Resend (New Feature)

**Endpoint:** `POST /api/auth/resend-registration-otp`

**Test Steps:**
1. Run "Resend Registration OTP" request
2. Check for cooldown period enforcement
3. Verify resend count tracking

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration OTP resent successfully",
  "data": {
    "otpSent": true,
    "resendCount": 1,
    "nextResendAllowedAt": "2024-01-15T10:05:00.000Z"
  }
}
```

### 3. Registration Verification

**Endpoint:** `POST /api/auth/verify-registration`

**Test Steps:**
1. Update `registration_otp` variable with actual OTP from SMS
2. Run "Verify Registration" request
3. Check for successful verification

### 4. Student Login

**Endpoint:** `POST /api/auth/login`

**Test Steps:**
1. Run "Student Login" request
2. Tokens will be automatically stored in environment
3. Check for single device login enforcement

### 5. Password Reset with Resend

**Endpoints:** 
- `POST /api/auth/forgot-password`
- `POST /api/auth/resend-forgot-password-otp`
- `POST /api/auth/reset-password`

**Test Steps:**
1. Run "Forgot Password" request
2. If needed, run "Resend Forgot Password OTP"
3. Update `password_reset_otp` with actual OTP
4. Run "Reset Password" request

## 👨‍💼 Admin API Testing

### 1. Super Admin Setup (One-time)

**Endpoint:** `POST /api/admin/setup-super-admin`

**Test Steps:**
1. Run "Setup Super Admin" request (only works once)
2. Super admin credentials will be created
3. Note: This endpoint becomes unavailable after first use

**Expected Response:**
```json
{
  "success": true,
  "message": "Super admin created successfully",
  "data": {
    "adminId": "admin_id_here",
    "username": "superadmin",
    "email": "superadmin@csaraniya.com",
    "role": "super_admin"
  }
}
```

### 2. Admin Login

**Endpoint:** `POST /api/admin/login`

**Test Steps:**
1. Run "Admin Login" request
2. Admin tokens will be automatically stored
3. Check session management

### 3. Admin Profile and Capabilities

**Endpoint:** `GET /api/admin/profile`

**Test Steps:**
1. Run "Get Admin Profile" request
2. Check role-based capabilities in response

**Expected Capabilities:**
```json
{
  "capabilities": {
    "canManageUsers": true,
    "canManageAdmins": true,
    "canManageCourses": true,
    "canViewAnalytics": true,
    "canManageSettings": true,
    "canManageSystem": true
  }
}
```

### 4. Dashboard Statistics

**Endpoint:** `GET /api/admin/dashboard`

**Test Steps:**
1. Run "Get Dashboard Stats" request
2. Check student and admin statistics
3. Verify role-based data access

### 5. Admin User Management

**Create Admin:** `POST /api/admin/create-admin`
**Get Admins:** `GET /api/admin/admins`

**Test Steps:**
1. Run "Create Admin User" request
2. Run "Get All Admins" request
3. Verify role-based permissions

### 6. Student Management

**Get Students:** `GET /api/admin/students`
**Update Status:** `PUT /api/admin/students/:studentId/status`

**Test Steps:**
1. Run "Get All Students" request
2. Run "Search Students" request
3. Run "Deactivate Student" request
4. Run "Reactivate Student" request

## ❌ Error Scenarios

### Test Rate Limiting
1. Run the same endpoint multiple times quickly
2. Check for rate limit headers:
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`
3. Verify 429 status code when limit exceeded

### Test Authentication Errors
1. Remove or modify authentication tokens
2. Verify 401 Unauthorized responses
3. Test expired token scenarios

### Test Validation Errors
1. Send invalid data formats
2. Send missing required fields
3. Verify 400 Bad Request responses with detailed error messages

### Test Permission Errors
1. Try admin endpoints with student tokens
2. Try super admin endpoints with regular admin tokens
3. Verify 403 Forbidden responses

## 🚦 Rate Limiting

The API implements different rate limits:

### Student Endpoints
- **Registration/Login:** 5 requests per 15 minutes
- **OTP Operations:** 3 requests per 15 minutes
- **General Auth:** 10 requests per 15 minutes

### Admin Endpoints
- **Admin Login:** 5 requests per 15 minutes
- **Admin Auth:** 10 requests per 15 minutes
- **Admin General:** 20 requests per 15 minutes

### Rate Limit Headers
Monitor these headers in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## 🖥️ Newman CLI Testing

### Installation
```bash
npm install -g newman
```

### Run Complete Test Suite
```bash
newman run Csaraniya_API_Collection.postman_collection.json \
  -e Csaraniya_API_Environment.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export test-results.html
```

### Run Specific Folder
```bash
# Test only student authentication
newman run Csaraniya_API_Collection.postman_collection.json \
  -e Csaraniya_API_Environment.postman_environment.json \
  --folder "Student Authentication"

# Test only admin endpoints
newman run Csaraniya_API_Collection.postman_collection.json \
  -e Csaraniya_API_Environment.postman_environment.json \
  --folder "Admin Authentication"
```

### Continuous Integration
```bash
# Run with detailed output and fail on errors
newman run Csaraniya_API_Collection.postman_collection.json \
  -e Csaraniya_API_Environment.postman_environment.json \
  --reporters cli,junit \
  --reporter-junit-export test-results.xml \
  --bail
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Server Connection Issues
- **Problem:** Cannot connect to server
- **Solution:** Ensure backend server is running on `http://localhost:3000`
- **Check:** Run health check endpoint first

#### 2. OTP Not Received
- **Problem:** OTP not received during registration/password reset
- **Solution:** Check SMS gateway configuration and logs
- **Workaround:** Use resend OTP endpoints

#### 3. Token Expiration
- **Problem:** 401 Unauthorized errors
- **Solution:** Re-login to get fresh tokens
- **Note:** Tokens are automatically managed by collection scripts

#### 4. Rate Limiting
- **Problem:** 429 Too Many Requests
- **Solution:** Wait for rate limit reset time
- **Check:** Monitor rate limit headers

#### 5. Database Connection
- **Problem:** 500 Internal Server Error
- **Solution:** Ensure MongoDB is running and connected
- **Check:** Server logs for database connection errors

### Environment Variables Not Set
If auto-generated variables are missing:
1. Check pre-request scripts are enabled
2. Manually set required variables
3. Re-import environment file

### Permission Errors
- Ensure you're using the correct token type (student vs admin)
- Check user role and permissions
- Verify endpoint access requirements

## 📊 Test Results Interpretation

### Success Indicators
- ✅ Response time < 5000ms
- ✅ Correct response format with `success` and `message` fields
- ✅ Appropriate HTTP status codes
- ✅ Auto-populated environment variables
- ✅ Rate limit headers present

### Failure Indicators
- ❌ Response time > 5000ms
- ❌ Missing required response fields
- ❌ Incorrect HTTP status codes
- ❌ Authentication/authorization failures
- ❌ Validation errors with invalid data

## 🔄 Automated Testing Workflow

### Pre-Test Setup
1. Start backend server
2. Ensure MongoDB is running
3. Clear any existing test data (optional)
4. Import latest collection and environment

### Test Execution Order
1. **System Health Check**
2. **Super Admin Setup** (if not done)
3. **Student Registration Flow**
4. **Student Authentication Flow**
5. **Admin Authentication Flow**
6. **Admin Management Operations**
7. **Student Management Operations**
8. **Error Scenario Testing**

### Post-Test Cleanup
1. Logout all active sessions
2. Review test results
3. Check server logs for errors
4. Document any issues found

## 📝 Notes

- **OTP Values:** Update OTP variables with actual values from SMS gateway
- **Device IDs:** Automatically generated for each test session
- **Tokens:** Automatically managed by collection scripts
- **Rate Limits:** Respect rate limiting to avoid test failures
- **Environment:** Use separate environments for different testing stages

## 🆘 Support

For issues with the API testing:
1. Check server logs for detailed error information
2. Verify all environment variables are correctly set
3. Ensure proper test execution order
4. Review rate limiting and authentication requirements

---

**Happy Testing! 🚀**

*This guide covers comprehensive testing of the Csaraniya API. Update OTP values with actual SMS gateway responses for complete testing.* 