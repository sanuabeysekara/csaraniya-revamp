# Postman Setup Guide for Csaraniya API

## 📥 Import Files

### Step 1: Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select **Upload Files**
4. Choose `Csaraniya_API_Collection.postman_collection.json`
5. Click **Import**

### Step 2: Import Environment
1. Click **Import** button again
2. Select **Upload Files**
3. Choose `Csaraniya_Environment.postman_environment.json`
4. Click **Import**

### Step 3: Select Environment
1. In the top-right corner, click the environment dropdown
2. Select **"Csaraniya Environment"**
3. Verify you can see variables like `{{base_url}}`, `{{admin_username}}`, etc.

## 🔧 Environment Variables

### Pre-configured Variables
The environment comes with these default values:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:3000` | API server URL |
| `student_mobile_number` | `+94771234567` | Test student mobile |
| `student_password` | `TestPassword123!` | Test student password |
| `super_admin_username` | `superadmin` | Super admin username |
| `super_admin_password` | `SuperAdmin123!` | Super admin password |
| `super_admin_setup_key` | `SUPER_ADMIN_SETUP_2024` | Setup key for super admin |

### Auto-generated Variables
These are automatically set by test scripts:
- `device_id` - Random device identifier
- `admin_device_id` - Random admin device identifier
- `student_access_token` - JWT token after student login
- `admin_access_token` - JWT token after admin login
- `target_admin_id` - Admin ID for testing password reset

## 🚀 Quick Start Testing

### 1. Setup Super Admin (First Time Only)
```
Admin Authentication → Setup Super Admin
```
- Creates the initial super admin account
- Uses the setup key from environment variables

### 2. Admin Login
```
Admin Authentication → Admin Login
```
- Logs in with super admin credentials
- Automatically saves access token

### 3. Test Admin Password Reset
```
Admin Management → Create Admin User
Admin Management → Get All Admins
Admin Management → Reset Admin Password
```

### 4. Test Student Registration
```
Student Authentication → Register Student
Student Authentication → Verify Registration (use OTP: 123456)
Student Authentication → Student Login
```

## 🔍 Troubleshooting

### Variables Not Showing
1. **Check Environment Selection**: Ensure "Csaraniya Environment" is selected in the dropdown
2. **Re-import Environment**: Delete and re-import the environment file
3. **Check Variable Names**: Variables should appear as `{{variable_name}}` in requests

### Common Issues

#### 1. "base_url" not found
- **Solution**: Make sure environment is selected
- **Check**: Top-right dropdown shows "Csaraniya Environment"

#### 2. Admin login fails
- **Solution**: Run "Setup Super Admin" first
- **Check**: Environment has correct `super_admin_setup_key`

#### 3. Student registration fails
- **Solution**: Make sure server is running on port 3000
- **Check**: `base_url` points to correct server

#### 4. OTP verification fails
- **Solution**: Use default OTP values from environment
- **Registration OTP**: `123456`
- **Password Reset OTP**: `654321`

### Environment Variable Verification
To check if variables are working:
1. Click the **eye icon** next to environment dropdown
2. You should see all variables listed
3. Current values should be visible

## 📋 Test Sequence

### Complete Admin Password Reset Test
1. **Setup Super Admin** (if not done)
2. **Admin Login**
3. **Create Admin User** (creates test admin)
4. **Get All Admins** (auto-selects target admin)
5. **Reset Admin Password** (resets target admin password)
6. **Verify**: Check response shows `sessionsTerminated: true`

### Complete Student Flow Test
1. **Register Student**
2. **Verify Registration** (OTP: 123456)
3. **Student Login**
4. **Get Profile**
5. **Update Profile**
6. **Student Logout**

## 🔐 Security Testing

### Permission Tests
- Try admin resetting super admin password (should fail)
- Try support user resetting any password (should fail)
- Try admin resetting support user password (should succeed)

### Rate Limiting Tests
- Make multiple rapid requests to see rate limiting in action
- Check response headers for rate limit information

## 📝 Notes

- **OTP Values**: Use `123456` for registration, `654321` for password reset
- **Device IDs**: Auto-generated for each test session
- **Tokens**: Automatically captured and reused
- **Admin Hierarchy**: Super Admin > Admin > Support

## 🆘 Support

If you encounter issues:
1. Check server is running (`npm start` in backend folder)
2. Verify environment variables are set correctly
3. Check Postman console for detailed error messages
4. Ensure MongoDB is running and accessible 