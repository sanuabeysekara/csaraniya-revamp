# 🚀 Csaraniya API - Postman Testing Guide

This guide will help you set up and test the Csaraniya API using Postman with the provided collection and environment files.

## 📁 Files Included

1. **`Csaraniya_API_Collection.postman_collection.json`** - Complete API collection with all endpoints
2. **`Csaraniya_API_Environment.postman_environment.json`** - Environment variables for testing
3. **`POSTMAN_TESTING_GUIDE.md`** - This guide

## 🔧 Setup Instructions

### Step 1: Import Collection and Environment

1. **Open Postman**
2. **Import Collection:**
   - Click "Import" button
   - Select `Csaraniya_API_Collection.postman_collection.json`
   - Click "Import"

3. **Import Environment:**
   - Click "Import" button
   - Select `Csaraniya_API_Environment.postman_environment.json`
   - Click "Import"

4. **Select Environment:**
   - In the top-right corner, select "Csaraniya API Environment" from the dropdown

### Step 2: Configure Environment Variables

Before testing, update these environment variables:

| Variable | Description | Default Value | Action Required |
|----------|-------------|---------------|-----------------|
| `baseUrl` | API server URL | `http://localhost:5000` | ✅ Keep default for local testing |
| `mobileNumber` | Test mobile number | `+94771234567` | ⚠️ **Change to your mobile number** |
| `deviceId` | Device identifier | Auto-generated | ✅ Auto-generated on first request |
| `accessToken` | JWT access token | Empty | ✅ Auto-set after login |
| `refreshToken` | JWT refresh token | Empty | ✅ Auto-set after login |
| `userId` | User ID | Empty | ✅ Auto-set after registration |

**Important:** Change the `mobileNumber` to a real mobile number that can receive SMS for OTP testing.

## 🧪 Testing Workflow

### Phase 1: System Health Check

1. **Health Check**
   - Run: `System Endpoints > Health Check`
   - Expected: `200 OK` with server status

2. **API Documentation**
   - Run: `System Endpoints > API Documentation`
   - Expected: `200 OK` with API endpoints list

### Phase 2: User Registration Flow

1. **Register User**
   - Run: `Authentication > 1. Register User`
   - Expected: `201 Created` with user ID
   - Note: OTP will be sent to your mobile number

2. **Verify Registration**
   - Check your mobile for OTP
   - Update the `otp` field in the request body
   - Run: `Authentication > 2. Verify Registration`
   - Expected: `200 OK` with verification success

### Phase 3: Authentication Flow

3. **Login**
   - Run: `Authentication > 3. Login`
   - Expected: `200 OK` with JWT tokens
   - Note: Tokens are automatically saved to environment

4. **Get Profile**
   - Run: `Authentication > 4. Get Profile`
   - Expected: `200 OK` with user profile data

5. **Update Profile**
   - Run: `Authentication > 5. Update Profile`
   - Expected: `200 OK` with updated profile

### Phase 4: Password Reset Flow

6. **Forgot Password**
   - Run: `Authentication > 6. Forgot Password`
   - Expected: `200 OK` with OTP sent confirmation
   - Note: New OTP will be sent to your mobile

7. **Reset Password**
   - Check your mobile for new OTP
   - Update the `otp` field in the request body
   - Run: `Authentication > 7. Reset Password`
   - Expected: `200 OK` with password reset success

8. **Login with New Password**
   - Update password in login request to `NewTestPass123!`
   - Run: `Authentication > 3. Login` again
   - Expected: `200 OK` with new tokens

### Phase 5: Session Management

9. **Logout**
   - Run: `Authentication > 8. Logout`
   - Expected: `200 OK` with logout success
   - Note: Tokens are automatically cleared

## 🔍 Error Testing

### Test Error Scenarios

1. **404 Not Found**
   - Run: `Error Testing > Invalid Endpoint (404)`
   - Expected: `404 Not Found`

2. **401 Unauthorized**
   - Run: `Error Testing > Unauthorized Access (401)`
   - Expected: `401 Unauthorized`

3. **Invalid Token**
   - Run: `Error Testing > Invalid Token (401)`
   - Expected: `401 Unauthorized`

4. **Validation Errors**
   - Run: `Error Testing > Validation Error (400)`
   - Expected: `400 Bad Request` with validation errors

## ⚡ Rate Limiting Tests

### Test Rate Limits

1. **OTP Rate Limiting**
   - Run: `Rate Limiting Tests > Test OTP Rate Limit`
   - Run it **4 times quickly** (within 1 minute)
   - Expected: First 3 requests succeed, 4th gets `429 Too Many Requests`

2. **Login Rate Limiting**
   - Run: `Rate Limiting Tests > Test Login Rate Limit`
   - Run it **6 times quickly** (within 15 minutes)
   - Expected: First 5 requests succeed, 6th gets `429 Too Many Requests`

## 📊 Understanding Responses

### Success Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Rate Limit Headers
Check these headers in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: When the rate limit resets

## 🔐 Authentication Notes

### JWT Token Management
- **Access Token**: Short-lived (24 hours), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens
- **Automatic Management**: Collection automatically handles token storage

### Single Device Login
- Only one device can be logged in at a time
- Logging in from a new device will invalidate previous sessions
- Use different `deviceId` values to test this behavior

## 🚨 Troubleshooting

### Common Issues

1. **OTP Not Received**
   - Check if mobile number is in correct E.164 format (+country_code_number)
   - Verify SMS gateway configuration in server
   - Check server logs for SMS delivery status

2. **Rate Limit Errors**
   - Wait for the rate limit window to reset
   - Check `RateLimit-Reset` header for reset time
   - Use different mobile numbers for testing if needed

3. **Authentication Errors**
   - Ensure you're logged in (run login request first)
   - Check if access token is set in environment
   - Verify token hasn't expired (24-hour limit)

4. **Validation Errors**
   - Check request body format matches expected schema
   - Ensure all required fields are provided
   - Verify data types and formats

### Server Not Running
If you get connection errors:
```bash
cd backend
npm run dev
```

### Environment Variables
Make sure your `.env` file in the backend directory has:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# ... other variables
```

## 📈 Advanced Testing

### Load Testing
1. Use Postman's Collection Runner
2. Set iterations to test multiple requests
3. Monitor rate limiting behavior
4. Check memory usage on server

### Security Testing
1. Test with invalid tokens
2. Try accessing protected routes without authentication
3. Test SQL injection attempts (should be blocked)
4. Test XSS attempts (should be sanitized)

### Performance Testing
1. Monitor response times (should be < 5000ms)
2. Test concurrent requests
3. Check memory usage during high load
4. Verify rate limiter cleanup is working

## 📝 Test Results Logging

The collection includes automatic test scripts that:
- ✅ Verify response times
- ✅ Check JSON structure
- ✅ Log rate limit information
- ✅ Automatically save tokens
- ✅ Clear tokens on logout

Check the **Test Results** tab after each request to see detailed test outcomes.

## 🔄 Continuous Testing

### Automated Testing
1. Use Postman's Collection Runner for automated testing
2. Set up Newman (CLI) for CI/CD integration
3. Schedule regular API health checks
4. Monitor API performance over time

### Newman CLI Usage
```bash
# Install Newman
npm install -g newman

# Run collection
newman run Csaraniya_API_Collection.postman_collection.json \
  -e Csaraniya_API_Environment.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export results.html
```

## 📞 Support

If you encounter issues:
1. Check server logs for detailed error information
2. Verify environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check API documentation at `http://localhost:5000/api`

---

**Happy Testing! 🚀**

Remember to test thoroughly before deploying to production. The Csaraniya API is designed to be robust, but proper testing ensures everything works as expected in your environment. 