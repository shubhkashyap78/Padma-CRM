import express from 'express';
import PDFDocument from 'pdfkit';
import Quotation from '../models/Quotation.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// helper: generate next quotation number like PTQ-2026-0001
async function generateQuotationNumber() {
  const year = new Date().getFullYear();
  const count = await Quotation.countDocuments({
    quotationNumber: { $regex: `^PTQ-${year}-` },
  });
  const next = String(count + 1).padStart(4, '0');
  return `PTQ-${year}-${next}`;
}

// GET all quotations
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { customerName: { $regex: req.query.search, $options: 'i' } },
        { quotationNumber: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    const quotations = await Quotation.find(filter).sort({ createdAt: -1 });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single quotation
router.get('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('lead');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create quotation (usually from a lead)
router.post('/', async (req, res) => {
  try {
    const quotationNumber = await generateQuotationNumber();
    const quotation = await Quotation.create({
      ...req.body,
      quotationNumber,
      createdBy: req.user._id,
    });
    res.status(201).json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update quotation
router.put('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    Object.assign(quotation, req.body);
    await quotation.save(); // triggers pre-save totalAmount recalculation
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE quotation
router.delete('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    await quotation.deleteOne();
    res.json({ message: 'Quotation removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /:id/whatsapp-text -> plain text formatted for sharing
router.get('/:id/whatsapp-text', async (req, res) => {
  try {
    const q = await Quotation.findById(req.params.id);
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
      if (d.transport) text += `Vehicle: ${d.transport}\n`;
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
    res.status(500).json({ message: err.message });
  }
});

// GET /:id/pdf -> stream a PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const q = await Quotation.findById(req.params.id);
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
        if (d.transport) meta.push(`Vehicle: ${d.transport}`);
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
    res.status(500).json({ message: err.message });
  }
});

export default router;
