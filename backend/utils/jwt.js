const jwt = require('jsonwebtoken');
const config = require('../config/config');

class JWTUtils {
  /**
   * Generate access token for students
   * @param {Object} payload - Token payload
   * @returns {string} - JWT token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'csaraniya',
      audience: 'csaraniya-users'
    });
  }

  /**
   * Generate refresh token for students
   * @param {Object} payload - Token payload
   * @returns {string} - Refresh JWT token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'csaraniya',
      audience: 'csaraniya-users'
    });
  }

  /**
   * Generate access token for admins
   * @param {Object} payload - Token payload
   * @returns {string} - Admin JWT token
   */
  generateAdminAccessToken(payload) {
    return jwt.sign(payload, config.jwt.adminSecret, {
      expiresIn: config.jwt.adminExpiresIn,
      issuer: 'csaraniya-admin',
      audience: 'csaraniya-admins'
    });
  }

  /**
   * Generate refresh token for admins
   * @param {Object} payload - Token payload
   * @returns {string} - Admin refresh JWT token
   */
  generateAdminRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.adminRefreshSecret, {
      expiresIn: config.jwt.adminRefreshExpiresIn,
      issuer: 'csaraniya-admin',
      audience: 'csaraniya-admins'
    });
  }

  /**
   * Verify access token for students
   * @param {string} token - JWT token
   * @returns {Object} - Decoded payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: 'csaraniya',
        audience: 'csaraniya-users'
      });
    } catch (error) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }

  /**
   * Verify refresh token for students
   * @param {string} token - Refresh JWT token
   * @returns {Object} - Decoded payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'csaraniya',
        audience: 'csaraniya-users'
      });
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
  }

  /**
   * Verify admin access token
   * @param {string} token - Admin JWT token
   * @returns {Object} - Decoded payload
   */
  verifyAdminAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.adminSecret, {
        issuer: 'csaraniya-admin',
        audience: 'csaraniya-admins'
      });
    } catch (error) {
      throw new Error(`Invalid admin access token: ${error.message}`);
    }
  }

  /**
   * Verify admin refresh token
   * @param {string} token - Admin refresh JWT token
   * @returns {Object} - Decoded payload
   */
  verifyAdminRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.adminRefreshSecret, {
        issuer: 'csaraniya-admin',
        audience: 'csaraniya-admins'
      });
    } catch (error) {
      throw new Error(`Invalid admin refresh token: ${error.message}`);
    }
  }

  /**
   * Generate token pair (access + refresh) for students
   * @param {Object} user - User object
   * @param {string} deviceId - Device identifier
   * @returns {Object} - Token pair with expiration times
   */
  generateTokenPair(user, deviceId) {
    const payload = {
      userId: user._id,
      mobileNumber: user.mobileNumber,
      role: user.role,
      deviceId: deviceId,
      type: 'student'
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Calculate expiration times
    const accessTokenExpiry = new Date();
    accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 24); // 24 hours

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry,
      refreshTokenExpiry,
      tokenType: 'Bearer'
    };
  }

  /**
   * Generate token pair (access + refresh) for admins
   * @param {Object} admin - Admin object
   * @param {string} deviceId - Device identifier
   * @param {string} sessionId - Session identifier
   * @returns {Object} - Admin token pair with expiration times
   */
  generateAdminTokenPair(admin, deviceId, sessionId) {
    const payload = {
      adminId: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      deviceId: deviceId,
      sessionId: sessionId,
      type: 'admin',
      permissions: admin.permissions
    };

    const accessToken = this.generateAdminAccessToken(payload);
    const refreshToken = this.generateAdminRefreshToken(payload);

    // Calculate expiration times
    const accessTokenExpiry = new Date();
    accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 8); // 8 hours

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setHours(refreshTokenExpiry.getHours() + 24); // 24 hours

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry,
      refreshTokenExpiry,
      tokenType: 'Bearer',
      sessionId
    };
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token
   * @returns {Object} - Decoded payload
   */
  decodeToken(token) {
    return jwt.decode(token, { complete: true });
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date} - Expiration date
   */
  getTokenExpiration(token) {
    const decoded = this.decodeToken(token);
    return new Date(decoded.payload.exp * 1000);
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} - True if expired
   */
  isTokenExpired(token) {
    try {
      const expiration = this.getTokenExpiration(token);
      return Date.now() >= expiration.getTime();
    } catch (error) {
      return true; // Consider invalid tokens as expired
    }
  }

  /**
   * Extract device ID from token
   * @param {string} token - JWT token
   * @returns {string} - Device ID
   */
  extractDeviceId(token) {
    try {
      const decoded = this.decodeToken(token);
      return decoded.payload.deviceId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract user ID from token
   * @param {string} token - JWT token
   * @returns {string} - User ID
   */
  extractUserId(token) {
    try {
      const decoded = this.decodeToken(token);
      return decoded.payload.userId || decoded.payload.adminId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract session ID from admin token
   * @param {string} token - Admin JWT token
   * @returns {string} - Session ID
   */
  extractSessionId(token) {
    try {
      const decoded = this.decodeToken(token);
      return decoded.payload.sessionId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is admin token
   * @param {string} token - JWT token
   * @returns {boolean} - True if admin token
   */
  isAdminToken(token) {
    try {
      const decoded = this.decodeToken(token);
      return decoded.payload.type === 'admin';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if token is student token
   * @param {string} token - JWT token
   * @returns {boolean} - True if student token
   */
  isStudentToken(token) {
    try {
      const decoded = this.decodeToken(token);
      return decoded.payload.type === 'student';
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify token based on type (auto-detect admin vs student)
   * @param {string} token - JWT token
   * @returns {Object} - Decoded payload
   */
  verifyToken(token) {
    if (this.isAdminToken(token)) {
      return this.verifyAdminAccessToken(token);
    } else {
      return this.verifyAccessToken(token);
    }
  }
}

module.exports = new JWTUtils(); 