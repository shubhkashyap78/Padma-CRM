// Creates the staff logins. Run once:  npm run seed:staff
// - Safe to re-run: existing emails are skipped (not overwritten).
// - After first login, each staff member should change their password (My Account page).
// - DELETE the passwords from this file once you've handed them out.
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User.js';

const STAFF = [
  { name: 'Staff Sales 1', email: 'sales1@padmatourism.com', password: 'Pt@UwdNwfY3U6', phone: '' },
  { name: 'Staff Sales 2', email: 'sales2@padmatourism.com', password: 'Pt@CqCLTbmM6L', phone: '' },
  { name: 'Staff Sales 3', email: 'sales3@padmatourism.com', password: 'Pt@Chsa7mWavw', phone: '' },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  for (const s of STAFF) {
    const exists = await User.findOne({ email: s.email.toLowerCase() });
    if (exists) {
      console.log(`SKIP    ${s.email} (already exists)`);
      continue;
    }
    await User.create({ ...s, role: 'staff' });
    console.log(`CREATED ${s.email}  /  ${s.password}`);
  }
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
