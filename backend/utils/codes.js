// Generates codes like PT-2026-0001 / PTQ-2026-0001.
// Uses the highest existing number (not a count) so deleting records never causes duplicates,
// and retries if two people save at the same moment.
export async function createWithCode(Model, field, prefix, data) {
  const year = new Date().getFullYear();
  const re = new RegExp(`^${prefix}-${year}-`);

  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await Model.findOne({ [field]: re })
      .sort({ [field]: -1 })
      .collation({ locale: 'en', numericOrdering: true })
      .select(field)
      .lean();
    const n = last ? parseInt(last[field].split('-').pop(), 10) + 1 : 1;
    const code = `${prefix}-${year}-${String(n).padStart(4, '0')}`;
    try {
      return await Model.create({ ...data, [field]: code });
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern[field]) continue;
      throw err;
    }
  }
  throw new Error('Could not generate a unique code, please try again');
}
