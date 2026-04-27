// Quick syntax/import check for all backend modules
try {
  const { connectDB } = await import('./src/config/db.js');
  console.log('✅ db.js OK');
} catch (e) { console.error('❌ db.js:', e.message); }

try {
  const { requireAuth } = await import('./src/middleware/auth.js');
  console.log('✅ middleware/auth.js OK');
} catch (e) { console.error('❌ middleware/auth.js:', e.message); }

try {
  const auth = await import('./src/routes/auth.js');
  console.log('✅ routes/auth.js OK');
} catch (e) { console.error('❌ routes/auth.js:', e.message); }

try {
  const tests = await import('./src/routes/tests.js');
  console.log('✅ routes/tests.js OK');
} catch (e) { console.error('❌ routes/tests.js:', e.message); }

try {
  const dash = await import('./src/routes/dashboard.js');
  console.log('✅ routes/dashboard.js OK');
} catch (e) { console.error('❌ routes/dashboard.js:', e.message); }

console.log('Check complete.');
