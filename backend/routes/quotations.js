import express from 'express';
import PDFDocument from 'pdfkit';
import Quotation from '../models/Quotation.js';
import Booking from '../models/Booking.js';
import Lead from '../models/Lead.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { quotationScope, leadScope } from '../middleware/access.js';
import { escapeRegex, pick, blankToNull, andFilters, validateId, sendError } from '../utils/helpers.js';
import { createWithCode } from '../utils/codes.js';

const router = express.Router();
router.use(protect);
router.param('id', validateId);

const EDITABLE = [
  'customerName', 'phone', 'email', 'packageName', 'destination', 'pax', 'travelDate',
  'validTill', 'itinerary', 'inclusions', 'exclusions', 'pricing', 'termsAndConditions', 'status',
];
const NULLABLE = ['travelDate', 'validTill'];

const findOwn = (req) => Quotation.findOne(andFilters({ _id: req.params.id }, quotationScope(req.user)));

// GET all quotations (staff: only their own)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const rx = { $regex: escapeRegex(req.query.search), $options: 'i' };
      filter.$or = [{ customerName: rx }, { quotationNumber: rx }];
    }
    const quotations = await Quotation.find(andFilters(quotationScope(req.user), filter)).sort({ createdAt: -1 });
    res.json(quotations);
  } catch (err) {
    sendError(res, err);
  }
});

// GET single quotation
router.get('/:id', async (req, res) => {
  try {
    const quotation = await findOwn(req).populate('lead');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (err) {
    sendError(res, err);
  }
});

// POST create quotation (usually from a lead)
router.post('/', async (req, res) => {
  try {
    const data = blankToNull(pick(req.body, EDITABLE), NULLABLE);
    let lead = null;
    if (req.body.lead) {
      lead = await Lead.findOne(andFilters({ _id: req.body.lead }, leadScope(req.user)));
      if (!lead) return res.status(404).json({ message: 'Lead not found' });
    }
    const quotation = await createWithCode(Quotation, 'quotationNumber', 'PTQ', {
      ...data,
      lead: lead?._id,
      createdBy: req.user._id,
    });
    // keep the lead pipeline moving
    if (lead && ['New', 'Contacted'].includes(lead.status)) {
      lead.status = 'Quoted';
      await lead.save();
    }
    res.status(201).json(quotation);
  } catch (err) {
    sendError(res, err);
  }
});

// PUT update quotation
router.put('/:id', async (req, res) => {
  try {
    const quotation = await findOwn(req);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    quotation.set(blankToNull(pick(req.body, EDITABLE), NULLABLE));
    await quotation.save(); // triggers pre-save totalAmount recalculation
    res.json(quotation);
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE quotation (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    await quotation.deleteOne();
    res.json({ message: 'Quotation removed' });
  } catch (err) {
    sendError(res, err);
  }
});

// POST /:id/convert-booking -> accepted quotation becomes a booking
router.post('/:id/convert-booking', async (req, res) => {
  try {
    const q = await findOwn(req);
    if (!q) return res.status(404).json({ message: 'Quotation not found' });
    if (!q.travelDate) return res.status(400).json({ message: 'Add a travel date to the quotation first' });
    if (!q.totalAmount || q.totalAmount <= 0) {
      return res.status(400).json({ message: 'Add price breakup to the quotation first' });
    }
    if (await Booking.findOne({ quotation: q._id })) {
      return res.status(400).json({ message: 'A booking already exists for this quotation' });
    }

    const lead = q.lead ? await Lead.findById(q.lead) : null;
    const days = q.itinerary?.length || 0;
    const endDate = days > 1 ? new Date(new Date(q.travelDate).getTime() + (days - 1) * 86400000) : undefined;

    const booking = await createWithCode(Booking, 'bookingCode', 'PT', {
      lead: q.lead,
      quotation: q._id,
      customerName: q.customerName,
      phone: q.phone,
      email: q.email,
      packageName: q.packageName,
      destination: q.destination,
      startDate: q.travelDate,
      endDate,
      pax: q.pax,
      totalAmount: q.totalAmount,
      createdBy: req.user._id,
      assignedTo: lead?.assignedTo || req.user._id,
    });

    q.status = 'Accepted';
    await q.save();
    if (lead) {
      lead.status = 'Converted';
      await lead.save();
    }
    res.status(201).json(booking);
  } catch (err) {
    sendError(res, err);
  }
});

// GET /:id/whatsapp-text -> plain text formatted for sharing
router.get('/:id/whatsapp-text', async (req, res) => {
  try {
    const q = await findOwn(req);
    if (!q) return res.status(404).json({ message: 'Quotation not found' });

    let text = `*PADMA TOURISM* 🙏\n`;
    text += `Quotation: ${q.quotationNumber}\n`;
    text += `--------------------------\n`;
    text += `*${q.packageName}*${q.destination ? ` - ${q.destination}` : ''}\n`;
    text += `Guest: ${q.customerName}\n`;
    text += `Pax: ${q.pax}\n`;
    if (q.travelDate) text += `Travel Date: ${new Date(q.travelDate).toLocaleDateString('en-IN')}\n`;
    if (q.validTill) text += `Valid Till: ${new Date(q.validTill).toLocaleDateString('en-IN')}\n`;
    text += `\n*ITINERARY*\n`;
    q.itinerary.forEach((d) => {
      text += `Day ${d.day}: ${d.title}\n`;
      if (d.description) text += `${d.description}\n`;
      if (d.meals) text += `Meals: ${d.meals}\n`;
      if (d.stay) text += `Stay: ${d.stay}\n`;
      text += `\n`;
    });
    if (q.inclusions?.length) {
      text += `*INCLUSIONS*\n`;
      q.inclusions.forEach((i) => (text += `✅ ${i}\n`));
      text += `\n`;
    }
    if (q.exclusions?.length) {
      text += `*EXCLUSIONS*\n`;
      q.exclusions.forEach((i) => (text += `❌ ${i}\n`));
      text += `\n`;
    }
    if (q.pricing?.length) {
      text += `*PRICE BREAKUP*\n`;
      q.pricing.forEach((p) => (text += `${p.label}: ₹${p.amount.toLocaleString('en-IN')}\n`));
      text += `*Total: ₹${q.totalAmount.toLocaleString('en-IN')}*\n\n`;
    }
    if (q.termsAndConditions) {
      text += `*TERMS & CONDITIONS*\n${q.termsAndConditions}\n\n`;
    }
    text += `For booking, reply to this message. Thank you for choosing Padma Tourism! 🌏`;

    res.json({ text });
  } catch (err) {
    sendError(res, err);
  }
});

// GET /:id/pdf -> stream a PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const q = await findOwn(req);
    if (!q) return res.status(404).json({ message: 'Quotation not found' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${q.quotationNumber}.pdf"`);
    doc.pipe(res);

    const navy = '#0b2545';
    const gold = '#c9a227';

    // Header
    doc.fillColor(navy).fontSize(20).font('Helvetica-Bold').text('PADMA TOURISM', { align: 'left' });
    doc.fillColor(gold).fontSize(10).font('Helvetica').text('Travel Quotation', { align: 'left' });
    doc.moveDown(0.3);
    doc.fillColor('#333').fontSize(10).text(`Quotation No: ${q.quotationNumber}`);
    doc.text(`Date: ${new Date(q.createdAt).toLocaleDateString('en-IN')}`);
    if (q.validTill) doc.text(`Valid Till: ${new Date(q.validTill).toLocaleDateString('en-IN')}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(gold).stroke();
    doc.moveDown();

    // Customer + package info
    doc.fillColor(navy).fontSize(13).font('Helvetica-Bold').text(q.packageName);
    if (q.destination) doc.fillColor('#555').fontSize(10).font('Helvetica').text(q.destination);
    doc.moveDown(0.5);
    doc.fillColor('#000').fontSize(10).font('Helvetica');
    doc.text(`Guest Name: ${q.customerName}`);
    doc.text(`Phone: ${q.phone}`);
    if (q.email) doc.text(`Email: ${q.email}`);
    doc.text(`Pax: ${q.pax}`);
    if (q.travelDate) doc.text(`Travel Date: ${new Date(q.travelDate).toLocaleDateString('en-IN')}`);
    doc.moveDown();

    // Itinerary
    if (q.itinerary?.length) {
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold').text('Itinerary');
      doc.moveDown(0.3);
      q.itinerary.forEach((d) => {
        doc.fillColor(gold).fontSize(10).font('Helvetica-Bold').text(`Day ${d.day}: ${d.title}`);
        doc.fillColor('#333').fontSize(9).font('Helvetica');
        if (d.description) doc.text(d.description);
        const meta = [];
        if (d.meals) meta.push(`Meals: ${d.meals}`);
        if (d.stay) meta.push(`Stay: ${d.stay}`);
        if (meta.length) doc.text(meta.join('  |  '));
        doc.moveDown(0.4);
      });
      doc.moveDown(0.3);
    }

    // Inclusions / Exclusions side by side (simple stacked to keep it robust)
    if (q.inclusions?.length) {
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold').text('Inclusions');
      doc.fillColor('#333').fontSize(9).font('Helvetica');
      q.inclusions.forEach((i) => doc.text(`• ${i}`));
      doc.moveDown(0.4);
    }
    if (q.exclusions?.length) {
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold').text('Exclusions');
      doc.fillColor('#333').fontSize(9).font('Helvetica');
      q.exclusions.forEach((i) => doc.text(`• ${i}`));
      doc.moveDown(0.4);
    }

    // Pricing table
    if (q.pricing?.length) {
      doc.moveDown(0.3);
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold').text('Price Breakup');
      doc.moveDown(0.2);
      q.pricing.forEach((p) => {
        doc.fillColor('#333').fontSize(9).font('Helvetica');
        doc.text(p.label, 50, doc.y, { continued: true, width: 400 });
        doc.text(`₹${p.amount.toLocaleString('en-IN')}`, { align: 'right' });
      });
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
      doc.moveDown(0.2);
      doc.fillColor(navy).fontSize(11).font('Helvetica-Bold');
      doc.text('Total', 50, doc.y, { continued: true, width: 400 });
      doc.text(`₹${q.totalAmount.toLocaleString('en-IN')}`, { align: 'right' });
      doc.moveDown();
    }

    // Terms
    if (q.termsAndConditions) {
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold').text('Terms & Conditions');
      doc.fillColor('#333').fontSize(8.5).font('Helvetica').text(q.termsAndConditions);
      doc.moveDown();
    }

    doc.fillColor('#999').fontSize(8).text('Thank you for choosing Padma Tourism.', { align: 'center' });

    doc.end();
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
