import express from 'express';
import { signup } from '../auth/signup.js';
import { login } from '../auth/login.js';
import { logout } from '../auth/logout.js';
import { resetPassword } from '../auth/resetPassword.js';
import { verifyEmail } from '../auth/verifyEmail.js';

const router = express.Router();

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/reset-password', resetPassword);
router.get('/verify-email', verifyEmail);

export default router; 