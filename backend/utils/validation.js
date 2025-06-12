const Joi = require('joi');

// Custom validation patterns
const mobileNumberPattern = /^\+[1-9]\d{1,14}$/; // E.164 format
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const pinPattern = /^\d{6}$/;
const otpPattern = /^\d{6}$/;

// Student validation schemas
const userRegistrationSchema = Joi.object({
  mobileNumber: Joi.string()
    .pattern(mobileNumberPattern)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be in international format (e.g., +94771234567)',
      'any.required': 'Mobile number is required'
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required'
    }),
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 50 characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  dateOfBirth: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required'
    }),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .required()
    .messages({
      'any.only': 'Gender must be male, female, or other',
      'any.required': 'Gender is required'
    }),
  preferredLanguage: Joi.string()
    .valid('en', 'si', 'ta')
    .optional()
    .default('en')
});

const userLoginSchema = Joi.object({
  mobileNumber: Joi.string()
    .pattern(mobileNumberPattern)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be in international format',
      'any.required': 'Mobile number is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    }),
  deviceId: Joi.string()
    .required()
    .messages({
      'any.required': 'Device ID is required'
    }),
  deviceName: Joi.string()
    .optional()
    .default('Unknown Device')
});

const otpVerificationSchema = Joi.object({
  mobileNumber: Joi.string()
    .pattern(mobileNumberPattern)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be in international format',
      'any.required': 'Mobile number is required'
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'any.required': 'OTP is required'
    })
});

const passwordResetSchema = Joi.object({
  mobileNumber: Joi.string()
    .pattern(mobileNumberPattern)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be in international format',
      'any.required': 'Mobile number is required'
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'any.required': 'OTP is required'
    }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password must not exceed 128 characters',
      'any.required': 'New password is required'
    })
});

const profileUpdateSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional(),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional(),
  dateOfBirth: Joi.date()
    .max('now')
    .optional(),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .optional(),
  preferredLanguage: Joi.string()
    .valid('en', 'si', 'ta')
    .optional(),
  profilePicture: Joi.string()
    .uri()
    .optional(),
  address: Joi.object({
    street: Joi.string().trim().max(100).optional(),
    city: Joi.string().trim().max(50).optional(),
    district: Joi.string().trim().max(50).optional(),
    province: Joi.string().trim().max(50).optional(),
    postalCode: Joi.string().trim().max(10).optional(),
    country: Joi.string().trim().max(50).optional()
  }).optional(),
  notifications: Joi.object({
    email: Joi.boolean().optional(),
    sms: Joi.boolean().optional(),
    push: Joi.boolean().optional(),
    marketing: Joi.boolean().optional()
  }).optional()
});

// Admin validation schemas
const adminLoginSchema = Joi.object({
  identifier: Joi.string()
    .required()
    .messages({
      'any.required': 'Username or email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    }),
  deviceId: Joi.string()
    .required()
    .messages({
      'any.required': 'Device ID is required'
    }),
  deviceName: Joi.string()
    .optional()
    .default('Unknown Device')
});

const adminCreationSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required'
    }),
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 50 characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  role: Joi.string()
    .valid('super_admin', 'admin', 'support')
    .required()
    .messages({
      'any.only': 'Role must be super_admin, admin, or support',
      'any.required': 'Role is required'
    })
});

// Validation functions
const validateUserRegistration = (data) => {
  return userRegistrationSchema.validate(data, { abortEarly: false });
};

const validateUserLogin = (data) => {
  return userLoginSchema.validate(data, { abortEarly: false });
};

const validateOTPVerification = (data) => {
  return otpVerificationSchema.validate(data, { abortEarly: false });
};

const validatePasswordReset = (data) => {
  return passwordResetSchema.validate(data, { abortEarly: false });
};

const validateProfileUpdate = (data) => {
  return profileUpdateSchema.validate(data, { abortEarly: false });
};

const validateAdminLogin = (data) => {
  return adminLoginSchema.validate(data, { abortEarly: false });
};

const validateAdminCreation = (data) => {
  return adminCreationSchema.validate(data, { abortEarly: false });
};

// Helper functions
const isValidMobileNumber = (mobileNumber) => {
  return mobileNumberPattern.test(mobileNumber);
};

const isValidEmail = (email) => {
  const emailSchema = Joi.string().email();
  const { error } = emailSchema.validate(email);
  return !error;
};

const isValidPassword = (password) => {
  return password && password.length >= 8 && password.length <= 128;
};

const isStrongPassword = (password) => {
  return passwordPattern.test(password);
};

const formatValidationErrors = (error) => {
  return error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value
  }));
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

const validateObjectId = (id) => {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
};

module.exports = {
  // Student validation functions
  validateUserRegistration,
  validateUserLogin,
  validateOTPVerification,
  validatePasswordReset,
  validateProfileUpdate,
  
  // Admin validation functions
  validateAdminLogin,
  validateAdminCreation,
  
  // Helper functions
  isValidMobileNumber,
  isValidEmail,
  isValidPassword,
  isStrongPassword,
  formatValidationErrors,
  sanitizeInput,
  validateObjectId,
  
  // Patterns
  mobileNumberPattern,
  passwordPattern
}; 