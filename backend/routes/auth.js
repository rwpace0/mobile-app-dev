import express from 'express';
import { signup } from '../auth/signup.js';
import { login } from '../auth/login.js';
import { logout } from '../auth/logout.js';
import { refreshToken } from '../auth/refresh.js';
import { resetPassword, requestPasswordReset, updateUserPassword } from '../auth/resetPassword.js';
import { verifyEmail } from '../auth/verifyEmail.js';
import { resendVerification } from '../auth/resendVerification.js';
import { getMe } from '../auth/me.js';
import { authLimiter, emailVerificationLimiter, authMeLimiter, verificationLimiter, passwordResetLimiter, accountChangeLimiter } from '../auth/rateLimiter.js';
import { changeUsername} from '../auth/changeUsername.js';
import { checkAvailability } from '../auth/signup.js';
import { changeEmail } from '../auth/changeEmail.js';
import { changePassword } from '../auth/changePassword.js';

const router = express.Router();

// Auth routes with specific rate limiters
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/logout', authLimiter, logout);
router.post('/refresh', authLimiter, refreshToken);
router.post('/request-password-reset', passwordResetLimiter, requestPasswordReset);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.post('/update-password', passwordResetLimiter, updateUserPassword);
router.get('/verify-email', verificationLimiter, verifyEmail);
router.post('/resend-verification', emailVerificationLimiter, resendVerification);
router.get('/me', authMeLimiter, getMe);
router.post('/change-username', accountChangeLimiter, changeUsername);
router.post('/change-email', accountChangeLimiter, changeEmail);
router.post('/change-password', accountChangeLimiter, changePassword);
router.post('/check-availability', checkAvailability);

export default router; 