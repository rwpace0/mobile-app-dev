import express from 'express';
import { signup } from '../auth/signup.js';
import { login } from '../auth/login.js';
import { logout } from '../auth/logout.js';
import { resetPassword } from '../auth/resetPassword.js';
import { verifyEmail } from '../auth/verifyEmail.js';
import { resendVerification } from '../auth/resendVerification.js';
import { getMe } from '../auth/me.js';
import { authLimiter, emailVerificationLimiter, authMeLimiter, verificationLimiter } from '../auth/rateLimiter.js';
import { updateUsername } from '../auth/updateUsername.js';

const router = express.Router();

// Auth routes with specific rate limiters
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/logout', authLimiter, logout);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/verify-email', verificationLimiter, verifyEmail);
router.post('/resend-verification', emailVerificationLimiter, resendVerification);
router.get('/me', authMeLimiter, getMe);
router.post('/update-username', updateUsername);

export default router; 