import express from 'express';
import Lead from '../models/Lead.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { isAdmin, leadScope } from '../middleware/access.js';
import { escapeRegex, pick, blankToNull, andFilters, validateId, sendError } from '../utils/helpers.js';

const router = express.Router();
router.use(protect);
router.param('id', validateId);

const EDITABLE = [
  'customerName', 'phone', 'email', 'source', 'packageInterest', 'destination',
  'travelDate', 'pax', 'budget', 'status', 'lostReason', 'nextFollowUp',
];
const NULLABLE = ['travelDate', 'budget', 'pax', 'nextFollowUp'];

// GET leads (staff: only their own)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (isAdmin(req.user) && req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.search) {
      const rx = { $regex: escapeRegex(req.query.search), $options: 'i' };
      filter.$or = [{ customerName: rx }, { phone: rx }];
    }
    const leads = await Lead.find(andFilters(leadScope(req.user), filter))
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    sendError(res, err);
  }
});

// GET single lead
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOne(andFilters({ _id: req.params.id }, leadScope(req.user)))
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    sendError(res, err);
  }
});

// POST create lead
router.post('/', async (req, res) => {
  try {
    const data = blankToNull(pick(req.body, EDITABLE), NULLABLE);
    delete data.lostReason;
    // only admin can hand a lead to someone else; staff leads are always theirs
    let assignedTo = req.user._id;
    if (isAdmin(req.user) && req.body.assignedTo) {
      const target = await User.findById(req.body.assignedTo);
      if (target && target.isActive) assignedTo = target._id;
    }
    const lead = await Lead.create({ ...data, assignedTo, createdBy: req.user._id });
    res.status(201).json(lead);
  } catch (err) {
    sendError(res, err);
  }
});

// PUT update lead
router.put('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOne(andFilters({ _id: req.params.id }, leadScope(req.user)));
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const data = blankToNull(pick(req.body, EDITABLE), NULLABLE);
    if (isAdmin(req.user) && req.body.assignedTo) {
      const target = await User.findById(req.body.assignedTo);
      if (!target) return res.status(400).json({ message: 'Assigned user not found' });
      data.assignedTo = target._id;
    }
    lead.set(data);
    await lead.save();
    await lead.populate('assignedTo', 'name email');
    res.json(lead);
  } catch (err) {
    sendError(res, err);
  }
});

// POST add note to lead
router.post('/:id/notes', async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Note text is required' });
    const lead = await Lead.findOne(andFilters({ _id: req.params.id }, leadScope(req.user)));
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    lead.notes.push({ text, addedBy: req.user._id });
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE lead (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    await lead.deleteOne();
    res.json({ message: 'Lead removed' });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
