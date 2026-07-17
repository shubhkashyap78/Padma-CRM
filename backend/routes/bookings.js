import express from 'express';
import Booking from '../models/Booking.js';
import Lead from '../models/Lead.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// helper: generate next booking code like PT-2026-0001
async function generateBookingCode() {
  const year = new Date().getFullYear();
  const count = await Booking.countDocuments({
    bookingCode: { $regex: `^PT-${year}-` },
  });
  const next = String(count + 1).padStart(4, '0');
  return `PT-${year}-${next}`;
}

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { customerName: { $regex: req.query.search, $options: 'i' } },
        { bookingCode: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('lead').populate('transport.vehicle');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create booking (optionally convert from a lead)
router.post('/', async (req, res) => {
  try {
    const bookingCode = await generateBookingCode();
    const booking = await Booking.create({
      ...req.body,
      bookingCode,
      createdBy: req.user._id,
    });

    // if created from a lead, mark lead as Converted
    if (req.body.lead) {
      await Lead.findByIdAndUpdate(req.body.lead, { status: 'Converted' });
    }

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update booking
router.put('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add a transport leg (vehicle assignment) to a booking
router.post('/:id/transport', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.transport.push(req.body);
    await booking.save();
    const populated = await Booking.findById(booking._id).populate('transport.vehicle');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a transport leg from a booking
router.delete('/:id/transport/:legId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.transport = booking.transport.filter((t) => t._id.toString() !== req.params.legId);
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    await booking.deleteOne();
    res.json({ message: 'Booking removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
