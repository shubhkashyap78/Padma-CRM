import express from 'express';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validateId, sendError } from '../utils/helpers.js';

const router = express.Router();
router.use(protect, adminOnly);
router.param('id', validateId);

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

// GET all staff/admin users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    sendError(res, err);
  }
});

// POST create new staff member (admin sets the initial id + password)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role === 'admin' ? 'admin' : 'staff',
    });
    res.status(201).json(publicUser(user));
  } catch (err) {
    sendError(res, err);
  }
});

// PUT update staff (name, phone, role, active)
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, role, isActive } = req.body;
    const isSelf = user._id.toString() === req.user._id.toString();

    if (isSelf && isActive === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    if (role !== undefined && !['admin', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (isSelf && role !== undefined && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    await user.save();
    res.json(publicUser(user));
  } catch (err) {
    sendError(res, err);
  }
});

// PUT reset a staff member's password (admin)
router.put('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = password;
    await user.save();
    res.json({ message: `Password reset for ${user.email}` });
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE staff member
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
