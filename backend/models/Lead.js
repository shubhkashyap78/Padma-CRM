import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    source: {
      type: String,
      enum: ['Website', 'WhatsApp', 'Phone Call', 'Walk-in', 'Referral', 'Social Media', 'Other'],
      default: 'Other',
    },
    packageInterest: { type: String, trim: true }, // e.g. "Odisha Pilgrimage", "North East India"
    destination: { type: String, trim: true },
    travelDate: { type: Date },
    pax: { type: Number, default: 1 },
    budget: { type: Number },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Quoted', 'Follow-up', 'Converted', 'Lost'],
      default: 'New',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: [noteSchema],
    lostReason: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Lead', leadSchema);
