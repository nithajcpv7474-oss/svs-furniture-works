import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import { logAction } from '../services/audit.service.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
      },
    });

    if (user) {
      logger.info(`New user registered: ${user.email}`);
      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          token: generateToken(user.id),
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn(`Authentication failed for email: ${email} - Invalid credentials`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      logger.warn(`Authentication blocked for deactivated account: ${email}`);
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact admin.' });
    }

    logger.info(`User logged in successfully: ${user.id} (${email})`);
    
    // Log Audit Action
    logAction({
      userId: user.id,
      action: 'Login',
      module: 'Auth',
      req
    });
    
    res.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        themePreference: user.themePreference,
        notificationPreferences: user.notificationPreferences,
        autoClearAlerts: user.autoClearAlerts,
        autoClearDays: user.autoClearDays,
        token: generateToken(user.id),
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  try {
    if (req.user) {
      logAction({
        userId: req.user.id,
        action: 'Logout',
        module: 'Auth',
        req
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        password: hashedPassword,
        forcePasswordChange: false
      },
    });

    logAction({
      userId: req.user.id,
      action: 'Update',
      module: 'Auth',
      newValue: { actionDescription: 'User changed their own password' },
      req
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};
