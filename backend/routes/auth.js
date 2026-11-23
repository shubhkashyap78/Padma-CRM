import express from 'express';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { protect } from '../middleware/auth.js';
import { isBlocked, recordFail, clearFails } from '../utils/rateLimit.js';
import { sendError } from '../utils/helpers.js';

const router = express.Router();

// @route  POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const key = `${req.ip}:${email.toLowerCase()}`;
    if (isBlocked(key)) {
      return res.status(429).json({ message: 'Too many failed attempts. Try again in 15 minutes.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password))) {
      recordFail(key);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });
    }

    clearFails(key);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    sendError(res, err);
  }
});

// @route  GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @route  PUT /api/auth/change-password  (any logged-in user changes their own password)
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    sendError(res, err);
  }
});

// @route  POST /api/auth/seed-admin  (one-time: creates the first admin; disabled once any admin exists)
router.post('/seed-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'An admin already exists. This route is now disabled.' });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const admin = await User.create({ name, email, password, role: 'admin' });
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id),
    });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
