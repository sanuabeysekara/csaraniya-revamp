const axios = require('axios');
const config = require('../config/config');

class SMSGateway {
  constructor() {
    this.apiUrl = config.sms.apiUrl;
    this.apiKey = config.sms.apiKey;
    this.fromNumber = config.sms.fromNumber;
  }

  /**
   * Generate a 6-digit OTP
   * @returns {string} - 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Format OTP message based on type
   * @param {string} otp - The OTP code
   * @param {string} type - OTP type
   * @param {number} expiryMinutes - OTP expiry time
   * @returns {string} - Formatted message
   */
  formatOTPMessage(otp, type, expiryMinutes = 5) {
    const messages = {
      registration: `Welcome to Csaraniya! Your verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes. Please do not share this code with anyone.`,
      login: `Your Csaraniya login verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes. If you didn't request this, please ignore.`,
      password_reset: `Your Csaraniya password reset code is: ${otp}. This code will expire in ${expiryMinutes} minutes. If you didn't request this, please ignore.`,
      mobile_verification: `Your Csaraniya mobile verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes.`,
      transaction_verification: `Your Csaraniya transaction verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes.`
    };

    return messages[type] || `Your Csaraniya verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes.`;
  }

  /**
   * Send SMS through the gateway
   * @param {string} to - Recipient phone number
   * @param {string} message - Message content
   * @returns {Promise} - API response
   */
  async sendSMS(to, message) {
    try {

      console.log("Message Sent : ", message);
      const payload = {
        to: to,
        from: this.fromNumber,
        message: message,
        api_key: this.apiKey
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000 // 10 seconds timeout
      });

      console.log(`SMS sent successfully to ${to}:`, response.data);
      return {
        success: true,
        messageId: response.data.message_id || response.data.id,
        data: response.data
      };

    } catch (error) {
      console.error('SMS sending failed:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Send OTP via SMS
   * @param {string} mobileNumber - Recipient mobile number
   * @param {string} otp - OTP code
   * @param {string} otpType - Type of OTP
   * @param {number} expiryMinutes - OTP expiry time
   * @returns {Promise} - SMS sending result
   */
  async sendOTP(mobileNumber, otp, otpType, expiryMinutes = 5) {
    try {
      const message = this.formatOTPMessage(otp, otpType, expiryMinutes);
      const result = await this.sendSMS(mobileNumber, message);

      return result;
    } catch (error) {
      console.error('OTP sending failed:', error);
      return {
        success: false,
        error: 'Failed to send OTP',
        details: error.message
      };
    }
  }

  /**
   * Send general notification SMS
   * @param {string} mobileNumber - Recipient mobile number
   * @param {string} message - Message content
   * @returns {Promise} - SMS sending result
   */
  async sendNotification(mobileNumber, message) {
    try {
      return await this.sendSMS(mobileNumber, message);
    } catch (error) {
      console.error('Notification SMS failed:', error);
      return {
        success: false,
        error: 'Failed to send notification',
        details: error.message
      };
    }
  }

  /**
   * Validate mobile number format
   * @param {string} mobileNumber - Mobile number to validate
   * @returns {boolean} - Validation result
   */
  validateMobileNumber(mobileNumber) {
    // E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(mobileNumber);
  }

  /**
   * Get delivery status (if supported by SMS gateway)
   * @param {string} messageId - Message ID from send response
   * @returns {Promise} - Delivery status
   */
  async getDeliveryStatus(messageId) {
    try {
      const response = await axios.get(`${this.apiUrl}/status/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return {
        success: true,
        status: response.data.status,
        deliveredAt: response.data.delivered_at
      };
    } catch (error) {
      console.error('Failed to get delivery status:', error);
      return {
        success: false,
        error: 'Failed to get delivery status'
      };
    }
  }
}

module.exports = new SMSGateway(); 