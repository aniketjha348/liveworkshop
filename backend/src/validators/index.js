/**
 * Zod Validation Schemas
 * Input validation for all API endpoints
 */
const { z } = require('zod');

// ==================== AUTH SCHEMAS ====================

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
});

const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
});

// ==================== WORKSHOP SCHEMAS ====================

const workshopSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  date_time: z.string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  duration_minutes: z.number()
    .int()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration must be less than 8 hours')
    .optional()
    .default(60),
  price: z.number()
    .int()
    .min(0, 'Price cannot be negative'),
  instructor_name: z.string()
    .min(2, 'Instructor name must be at least 2 characters')
    .max(100, 'Instructor name must be less than 100 characters'),
  sale_price: z.number().int().min(0).optional().nullable(),
  sale_end_time: z.string().optional().nullable(),
  create_zoom_meeting: z.boolean().optional().default(false)
});

const workshopUpdateSchema = workshopSchema.partial();

// ==================== COUPON SCHEMAS ====================

const couponSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be less than 20 characters')
    .toUpperCase(),
  discount_percent: z.number()
    .int()
    .min(1, 'Discount must be at least 1%')
    .max(100, 'Discount cannot exceed 100%'),
  max_uses: z.number()
    .int()
    .min(1, 'Max uses must be at least 1')
    .optional()
    .nullable(),
  is_active: z.boolean().optional().default(true)
});

const couponUpdateSchema = couponSchema.partial();

// ==================== PAYMENT SCHEMAS ====================

const createOrderSchema = z.object({
  workshop_id: z.string().min(1, 'Workshop ID is required'),
  coupon_code: z.string().optional()
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required')
});

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  workshop_id: z.string().min(1, 'Workshop ID is required')
});

// ==================== PROFILE SCHEMAS ====================

const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  phone: z.string()
    .regex(/^[0-9]{10}$/, 'Phone must be 10 digits')
    .optional()
    .nullable(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .nullable()
});

// ==================== VALIDATION MIDDLEWARE ====================

/**
 * Creates a validation middleware for a given Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          detail: 'Validation failed',
          errors
        });
      }
      
      // Replace body with parsed data (includes defaults and transformations)
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(400).json({
        detail: 'Invalid request data'
      });
    }
  };
};

module.exports = {
  // Schemas
  registerSchema,
  loginSchema,
  changePasswordSchema,
  workshopSchema,
  workshopUpdateSchema,
  couponSchema,
  couponUpdateSchema,
  createOrderSchema,
  verifyPaymentSchema,
  validateCouponSchema,
  updateProfileSchema,
  
  // Middleware
  validate
};
