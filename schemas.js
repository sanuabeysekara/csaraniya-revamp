const mongoose = require('mongoose');

// ==================== CATEGORY AND TAG MODELS ====================

// Category Model - Main categories for courses
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 10
  },
  icon: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true,
    match: /^#[0-9A-F]{6}$/i // Hex color validation
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// SubCategory Model - Subcategories within categories
const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 15
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  icon: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Tag Model - Separate schema for all tags for analytics
const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 50
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    enum: ['content', 'skill', 'difficulty', 'topic', 'industry', 'tool', 'other']
  },
  usageCount: {
    type: Number,
    default: 0
  },
  relatedTags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// ==================== CONTENT MODELS ====================

// Question Model - Individual questions that can be reused
const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple_choice', 'true_false', 'fill_blank', 'essay']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  // Language selection for questions
  language: {
    type: String,
    required: true,
    enum: ['en', 'si', 'ta']
  },
  // For multiple choice questions
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false
    }
  }],
  // For true/false questions
  correctAnswer: {
    type: Boolean,
    required: function() {
      return this.type === 'true_false';
    }
  },
  // For fill in the blank questions
  correctAnswers: [{
    type: String,
    trim: true
  }],
  // For essay questions
  sampleAnswer: {
    type: String,
    trim: true
  },
  // Tags reference for analytics
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Quiz Model - Collection of questions
const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  // Language selection for quiz
  language: {
    type: String,
    required: true,
    enum: ['en', 'si', 'ta']
  },
  questions: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  settings: {
    timeLimit: {
      type: Number, // in minutes
      required: true,
      min: 1
    },
    maxAttempts: {
      type: Number,
      required: true,
      min: 1,
      default: 3
    },
    passingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 60
    },
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    showResultsImmediately: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    }
  },
  totalPoints: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  // Tags reference for analytics
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Course Model with embedded sections
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  thumbnail: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  // Language selection for course - controls what content can be added
  language: {
    type: String,
    required: true,
    enum: ['en', 'si', 'ta'],
    default: 'en'
  },
  // Embedded course sections
  sections: [{
    sectionId: {
      type: String,
      required: true,
      unique: true // Unique identifier for progress tracking
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    order: {
      type: Number,
      required: true
    },
    // Content items in this section
    content: [{
      contentId: {
        type: String,
        required: true,
        unique: true // Unique identifier for tracking progress
      },
      type: {
        type: String,
        required: true,
        enum: ['quiz', 'video', 'rich_content', 'iframe']
      },
      title: {
        type: String,
        required: true,
        trim: true
      },
      order: {
        type: Number,
        required: true
      },
      // For quiz content
      quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: function() {
          return this.type === 'quiz';
        }
      },
      // For video content
      videoUrl: {
        type: String,
        required: function() {
          return this.type === 'video';
        }
      },
      videoDuration: {
        type: Number, // in seconds
        required: function() {
          return this.type === 'video';
        }
      },
      videoLanguage: {
        type: String,
        enum: ['en', 'si', 'ta'],
        required: function() {
          return this.type === 'video';
        }
      },
      // Tags for video content
      videoTags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
        required: function() {
          return this.type === 'video';
        }
      }],
      // For rich content
      richContent: {
        type: String, // HTML content
        required: function() {
          return this.type === 'rich_content';
        }
      },
      richContentLanguage: {
        type: String,
        enum: ['en', 'si', 'ta'],
        required: function() {
          return this.type === 'rich_content';
        }
      },
      // Tags for rich content
      richContentTags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
        required: function() {
          return this.type === 'rich_content';
        }
      }],
      // For iframe content
      iframeUrl: {
        type: String,
        required: function() {
          return this.type === 'iframe';
        }
      },
      iframeHeight: {
        type: Number,
        default: 400
      },
      iframeLanguage: {
        type: String,
        enum: ['en', 'si', 'ta'],
        required: function() {
          return this.type === 'iframe';
        }
      },
      // Tags for iframe content
      iframeTags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
        required: function() {
          return this.type === 'iframe';
        }
      }],
      // Common properties
      isRequired: {
        type: Boolean,
        default: true
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  pricing: {
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'LKR'
    },
    discountPrice: {
      type: Number,
      min: 0
    },
    discountValidUntil: {
      type: Date
    }
  },
  duration: {
    estimated: {
      type: Number, // in hours
      required: true,
      min: 1
    },
    videoDuration: {
      type: Number, // total video duration in minutes
      default: 0
    }
  },
  enrollment: {
    maxStudents: {
      type: Number,
      min: 1,
      default: 1000
    },
    currentEnrollments: {
      type: Number,
      default: 0
    },
    enrollmentDeadline: {
      type: Date
    }
  },
  requirements: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String,
    required: true,
    trim: true
  }],
  // Tags reference for analytics
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// ==================== PAYMENT MODELS ====================

// QR Code Batch Model - For bulk QR code generation
const qrCodeBatchSchema = new mongoose.Schema({
  batchName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }],
  totalCodes: {
    type: Number,
    required: true,
    min: 1
  },
  usedCodes: {
    type: Number,
    default: 0
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// QR Code Model - Individual QR codes
const qrCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QrCodeBatch',
    required: true
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }],
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usedAt: {
    type: Date
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Payment Model - For bank transfer payments
const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank_transfer', 'qr_code']
  },
  // For bank transfer
  bankTransfer: {
    receiptImage: {
      type: String,
      required: function() {
        return this.paymentMethod === 'bank_transfer';
      }
    },
    transferDate: {
      type: Date,
      required: function() {
        return this.paymentMethod === 'bank_transfer';
      }
    },
    transferAmount: {
      type: Number,
      required: function() {
        return this.paymentMethod === 'bank_transfer';
      },
      min: 0
    },
    bankName: {
      type: String,
      required: function() {
        return this.paymentMethod === 'bank_transfer';
      }
    },
    referenceNumber: {
      type: String,
      required: function() {
        return this.paymentMethod === 'bank_transfer';
      }
    }
  },
  // For QR code
  qrCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QrCode',
    required: function() {
      return this.paymentMethod === 'qr_code';
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // For admin review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  reviewedAt: {
    type: Date
  },
  reviewNote: {
    type: String,
    trim: true
  },
  // Auto-approved for QR codes
  autoApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ==================== ENROLLMENT MODELS ====================

// Enrollment Model - Student enrollment in courses
const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'suspended', 'dropped'],
    default: 'active'
  },
  progress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    completedSections: {
      type: Number,
      default: 0
    },
    totalSections: {
      type: Number,
      required: true
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    }
  },
  completionDate: {
    type: Date
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// ==================== PROGRESS TRACKING MODELS ====================

// Quiz Attempt Model - Track student quiz attempts (with contentId)
const quizAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  // Content ID to identify specific quiz instance in course sections
  contentId: {
    type: String,
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: {
      type: String // For multiple choice
    },
    booleanAnswer: {
      type: Boolean // For true/false
    },
    textAnswer: {
      type: String // For fill in the blank and essay
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    pointsEarned: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  timeSpent: {
    type: Number, // in seconds
    required: true
  },
  score: {
    points: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    passed: {
      type: Boolean,
      required: true
    }
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'abandoned'],
    required: true
  }
}, {
  timestamps: true
});

// Course Progress Model - Overall course progress tracking
const courseProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  sections: [{
    sectionId: {
      type: String, // Reference to embedded section in course
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    lastAccessedAt: {
      type: Date
    }
  }],
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Rich Content Progress Model - Track reading progress
const richContentProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  contentId: {
    type: String, // Reference to the content item in the course sections
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  lastPosition: {
    type: Number, // scroll position or reading position
    default: 0
  },
  visitCount: {
    type: Number,
    default: 0
  },
  firstAccessedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Video Progress Model - Track video watching progress
const videoProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  contentId: {
    type: String, // Reference to the content item in the course sections
    required: true
  },
  watchedDuration: {
    type: Number, // in seconds
    default: 0
  },
  totalDuration: {
    type: Number, // in seconds
    required: true
  },
  watchedPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  lastWatchedPosition: {
    type: Number, // in seconds
    default: 0
  },
  watchSessions: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in seconds
      required: true
    },
    startPosition: {
      type: Number, // in seconds
      required: true
    },
    endPosition: {
      type: Number, // in seconds
      required: true
    }
  }],
  firstAccessedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Iframe Progress Model - Track iframe content interaction
const iframeProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  contentId: {
    type: String, // Reference to the content item in the course sections
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  interactions: [{
    type: {
      type: String,
      enum: ['load', 'focus', 'blur', 'scroll', 'click'],
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed // Additional interaction data
    }
  }],
  visitCount: {
    type: Number,
    default: 0
  },
  firstAccessedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ==================== VALIDATION MIDDLEWARE ====================

// Pre-save middleware for SubCategory to validate category exists
subCategorySchema.pre('save', async function(next) {
  if (this.isModified('category')) {
    try {
      const category = await mongoose.model('Category').findById(this.category);
      if (!category || !category.isActive) {
        return next(new Error('Category must exist and be active'));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware for Quiz to validate question language matches quiz language
quizSchema.pre('save', async function(next) {
  if (this.isModified('questions') || this.isModified('language')) {
    try {
      const questionIds = this.questions.map(q => q.question);
      const questions = await mongoose.model('Question').find({
        _id: { $in: questionIds },
        language: { $ne: this.language }
      });
      
      if (questions.length > 0) {
        return next(new Error(`All questions must be in ${this.language} language to match the quiz language`));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware for Course to validate subcategory belongs to category
courseSchema.pre('save', async function(next) {
  if (this.isModified('category') || this.isModified('subCategory')) {
    try {
      const subCategory = await mongoose.model('SubCategory').findById(this.subCategory).populate('category');
      if (!subCategory || !subCategory.isActive) {
        return next(new Error('SubCategory must exist and be active'));
      }
      if (subCategory.category._id.toString() !== this.category.toString()) {
        return next(new Error('SubCategory must belong to the selected Category'));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware for Course to validate content language matches course language
courseSchema.pre('save', async function(next) {
  if (this.isModified('sections') || this.isModified('language')) {
    try {
      // Check all quiz references in sections
      const quizIds = [];
      this.sections.forEach(section => {
        section.content.forEach(content => {
          if (content.type === 'quiz' && content.quiz) {
            quizIds.push(content.quiz);
          }
          // Check content language for videos, rich content, and iframes
          if (content.type === 'video' && content.videoLanguage !== this.language) {
            return next(new Error(`Video content must be in ${this.language} language to match the course language`));
          }
          if (content.type === 'rich_content' && content.richContentLanguage !== this.language) {
            return next(new Error(`Rich content must be in ${this.language} language to match the course language`));
          }
          if (content.type === 'iframe' && content.iframeLanguage !== this.language) {
            return next(new Error(`Iframe content must be in ${this.language} language to match the course language`));
          }
        });
      });
      
      if (quizIds.length > 0) {
        const quizzes = await mongoose.model('Quiz').find({
          _id: { $in: quizIds },
          language: { $ne: this.language }
        });
        
        if (quizzes.length > 0) {
          return next(new Error(`All quizzes must be in ${this.language} language to match the course language`));
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware for Tag to increment usage count when referenced
tagSchema.pre('save', function(next) {
  if (this.isNew) {
    this.usageCount = 0;
  }
  next();
});

// ==================== INDEXES ====================

// Category and Tag Models Indexes
categorySchema.index({ code: 1 });
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });

subCategorySchema.index({ code: 1 });
subCategorySchema.index({ category: 1, isActive: 1 });
subCategorySchema.index({ name: 1 });

tagSchema.index({ name: 1 });
tagSchema.index({ category: 1 });
tagSchema.index({ usageCount: -1 });
tagSchema.index({ isActive: 1 });

// Content Models Indexes
questionSchema.index({ category: 1, subCategory: 1, difficulty: 1, language: 1, isActive: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ language: 1 });

quizSchema.index({ category: 1, subCategory: 1, difficulty: 1, language: 1, isActive: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ 'questions.question': 1 });
quizSchema.index({ language: 1 });
quizSchema.index({ tags: 1 });

courseSchema.index({ category: 1, subCategory: 1, level: 1, language: 1, isPublished: 1, isActive: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ createdBy: 1 });
courseSchema.index({ 'pricing.price': 1 });
courseSchema.index({ language: 1 });
courseSchema.index({ 'sections.sectionId': 1 });
courseSchema.index({ 'sections.content.contentId': 1 });

// Payment Models Indexes
qrCodeBatchSchema.index({ isActive: 1, validUntil: 1 });
qrCodeBatchSchema.index({ courses: 1 });

qrCodeSchema.index({ code: 1 });
qrCodeSchema.index({ batch: 1, isUsed: 1 });
qrCodeSchema.index({ isActive: 1, validUntil: 1 });

paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ 'courses.course': 1 });
paymentSchema.index({ status: 1, createdAt: 1 });

// Enrollment Models Indexes
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });

// Progress Tracking Models Indexes
quizAttemptSchema.index({ student: 1, quiz: 1, contentId: 1, attemptNumber: 1 });
quizAttemptSchema.index({ enrollment: 1 });
quizAttemptSchema.index({ quiz: 1, 'score.passed': 1 });
quizAttemptSchema.index({ contentId: 1 });

courseProgressSchema.index({ student: 1, course: 1 }, { unique: true });
courseProgressSchema.index({ enrollment: 1 });

richContentProgressSchema.index({ student: 1, course: 1, contentId: 1 }, { unique: true });
richContentProgressSchema.index({ enrollment: 1 });

videoProgressSchema.index({ student: 1, course: 1, contentId: 1 }, { unique: true });
videoProgressSchema.index({ enrollment: 1 });

iframeProgressSchema.index({ student: 1, course: 1, contentId: 1 }, { unique: true });
iframeProgressSchema.index({ enrollment: 1 });

// ==================== POST-SAVE MIDDLEWARE FOR ANALYTICS ====================

// Post-save middleware to update tag usage count
const updateTagUsage = async function(tagIds, increment = true) {
  if (tagIds && tagIds.length > 0) {
    const updateValue = increment ? 1 : -1;
    await mongoose.model('Tag').updateMany(
      { _id: { $in: tagIds } },
      { $inc: { usageCount: updateValue } }
    );
  }
};

// Track tag usage for questions
questionSchema.post('save', async function(doc) {
  if (this.isNew && doc.tags && doc.tags.length > 0) {
    await updateTagUsage(doc.tags, true);
  }
});

questionSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && this.getUpdate().$set && this.getUpdate().$set.tags) {
    const oldDoc = await this.model.findById(doc._id);
    const oldTags = oldDoc ? oldDoc.tags : [];
    const newTags = this.getUpdate().$set.tags;
    
    // Decrease count for removed tags
    const removedTags = oldTags.filter(tag => !newTags.includes(tag.toString()));
    if (removedTags.length > 0) {
      await updateTagUsage(removedTags, false);
    }
    
    // Increase count for new tags
    const addedTags = newTags.filter(tag => !oldTags.includes(tag.toString()));
    if (addedTags.length > 0) {
      await updateTagUsage(addedTags, true);
    }
  }
});

// Track tag usage for quizzes
quizSchema.post('save', async function(doc) {
  if (this.isNew && doc.tags && doc.tags.length > 0) {
    await updateTagUsage(doc.tags, true);
  }
});

// Track tag usage for courses
courseSchema.post('save', async function(doc) {
  if (this.isNew && doc.tags && doc.tags.length > 0) {
    await updateTagUsage(doc.tags, true);
  }
  
  // Track tags in course content
  if (doc.sections) {
    doc.sections.forEach(section => {
      section.content.forEach(async content => {
        if (content.videoTags && content.videoTags.length > 0) {
          await updateTagUsage(content.videoTags, true);
        }
        if (content.richContentTags && content.richContentTags.length > 0) {
          await updateTagUsage(content.richContentTags, true);
        }
        if (content.iframeTags && content.iframeTags.length > 0) {
          await updateTagUsage(content.iframeTags, true);
        }
      });
    });
  }
});

// ==================== STATIC METHODS FOR ANALYTICS ====================

// Tag analytics methods
tagSchema.statics.getPopularTags = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('name displayName usageCount category');
};

tagSchema.statics.getTagsByCategory = function(category) {
  return this.find({ category, isActive: true })
    .sort({ usageCount: -1 });
};

tagSchema.statics.getTagAnalytics = async function() {
  const analytics = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        totalTags: { $sum: 1 },
        totalUsage: { $sum: '$usageCount' },
        avgUsage: { $avg: '$usageCount' },
        maxUsage: { $max: '$usageCount' },
        minUsage: { $min: '$usageCount' }
      }
    },
    { $sort: { totalUsage: -1 } }
  ]);
  
  return analytics;
};

// Category analytics methods
categorySchema.statics.getCategoryStats = async function() {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'subcategories',
        localField: '_id',
        foreignField: 'category',
        as: 'subCategories'
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: 'category',
        as: 'courses'
      }
    },
    {
      $project: {
        name: 1,
        code: 1,
        subCategoryCount: { $size: '$subCategories' },
        courseCount: { $size: '$courses' },
        activeCourses: {
          $size: {
            $filter: {
              input: '$courses',
              cond: { $eq: ['$this.isActive', true] }
            }
          }
        }
      }
    },
    { $sort: { courseCount: -1 } }
  ]);
  
  return stats;
};

// Course analytics methods
courseSchema.statics.getCourseAnalytics = async function() {
  const analytics = await this.aggregate([
    { $match: { isActive: true, isPublished: true } },
    {
      $group: {
        _id: {
          category: '$category',
          language: '$language',
          level: '$level'
        },
        courseCount: { $sum: 1 },
        avgPrice: { $avg: '$pricing.price' },
        totalEnrollments: { $sum: '$enrollment.currentEnrollments' },
        avgDuration: { $avg: '$duration.estimated' }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id.category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $project: {
        _id: 1,
        courseCount: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
        totalEnrollments: 1,
        avgDuration: { $round: ['$avgDuration', 1] },
        categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] }
      }
    },
    { $sort: { courseCount: -1 } }
  ]);
  
  return analytics;
};

// ==================== MODEL EXPORTS ====================

const Category = mongoose.model('Category', categorySchema);
const SubCategory = mongoose.model('SubCategory', subCategorySchema);
const Tag = mongoose.model('Tag', tagSchema);
const Question = mongoose.model('Question', questionSchema);
const Quiz = mongoose.model('Quiz', quizSchema);
const Course = mongoose.model('Course', courseSchema);
const QrCodeBatch = mongoose.model('QrCodeBatch', qrCodeBatchSchema);
const QrCode = mongoose.model('QrCode', qrCodeSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);
const RichContentProgress = mongoose.model('RichContentProgress', richContentProgressSchema);
const VideoProgress = mongoose.model('VideoProgress', videoProgressSchema);
const IframeProgress = mongoose.model('IframeProgress', iframeProgressSchema);

module.exports = {
  Category,
  SubCategory,
  Tag,
  Question,
  Quiz,
  Course,
  QrCodeBatch,
  QrCode,
  Payment,
  Enrollment,
  QuizAttempt,
  CourseProgress,
  RichContentProgress,
  VideoProgress,
  IframeProgress
};