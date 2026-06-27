import express from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller.js';
import * as authController from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema } from '../validations/auth.validation.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', verifyToken, getMe);
router.post('/logout', logout);
router.post('/change-password', verifyToken, authController.changePassword);

export default router;
