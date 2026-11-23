import express from 'express';
import Booking from '../models/Booking.js';
import Lead from '../models/Lead.js';
import Payment from '../models/Payment.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { isAdmin, bookingScope, leadScope } from '../middleware/access.js';
import { escapeRegex, pick, blankToNull, andFilters, validateId, sendError } from '../utils/helpers.js';
import { createWithCode } from '../utils/codes.js';

const router = express.Router();
router.use(protect);
router.param('id', validateId);

const EDITABLE = [
  'customerName', 'phone', 'email', 'packageName', 'destination', 'startDate',
  'endDate', 'pax', 'travelers', 'totalAmount', 'status', 'itineraryNotes',
];
const NULLABLE = ['endDate'];

// GET bookings (staff: only their own)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const rx = { $regex: escapeRegex(req.query.search), $options: 'i' };
      filter.$or = [{ customerName: rx }, { bookingCode: rx }, { phone: rx }];
    }
    const bookings = await Booking.find(andFilters(bookingScope(req.user), filter)).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    sendError(res, err);
  }
});

// GET single booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne(andFilters({ _id: req.params.id }, bookingScope(req.user))).populate('lead');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    sendError(res, err);
  }
});

// POST create booking (optionally converting a lead)
router.post('/', async (req, res) => {
  try {
    const data = blankToNull(pick(req.body, EDITABLE), NULLABLE);
    delete data.status; // new bookings always start as Confirmed
    let assignedTo = req.user._id;
    let lead = null;

    if (req.body.lead) {
      lead = await Lead.findOne(andFilters({ _id: req.body.lead }, leadScope(req.user)));
      if (!lead) return res.status(404).json({ message: 'Lead not found' });
      if (lead.assignedTo) assignedTo = lead.assignedTo;
    }

    const booking = await createWithCode(Booking, 'bookingCode', 'PT', {
      ...data,
      lead: lead?._id,
      createdBy: req.user._id,
      assignedTo,
    });

    if (lead) {
      lead.status = 'Converted';
      await lead.save();
    }
    res.status(201).json(booking);
  } catch (err) {
    sendError(res, err);
  }
});

// PUT update booking (amountPaid can only change via Payments)
router.put('/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne(andFilters({ _id: req.params.id }, bookingScope(req.user)));
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const data = blankToNull(pick(req.body, EDITABLE), NULLABLE);
    if (data.totalAmount !== undefined && Number(data.totalAmount) < booking.amountPaid) {
      return res.status(400).json({ message: `Total cannot be less than amount already paid (₹${booking.amountPaid})` });
    }
    booking.set(data);
    await booking.save();
    res.json(booking);
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE booking (admin only) - also removes its payments so totals stay correct
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    await Payment.deleteMany({ booking: booking._id });
    await booking.deleteOne();
    res.json({ message: 'Booking and its payments removed' });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
