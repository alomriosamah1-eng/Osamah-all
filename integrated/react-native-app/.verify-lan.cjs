// تحقق: نفس إعداد tRPC الذي يستخدمه المتصفح، ضد IP الشبكة (وليس localhost).
const { createTRPCClient, httpBatchLink } = require('@trpc/client');
const superjson = require('superjson');

const BASE = 'http://192.168.0.232:3000';
const client = createTRPCClient({
  links: [httpBatchLink({ url: `${BASE}/api/trpc`, transformer: superjson })],
});
const c = client;

async function main() {
  console.log('BASE =', BASE);
  try {
    const status = await c.osamah.opencode.status.query();
    console.log('status.connected =', status && status.connected, '| providers=', status && status.providerCount, '| models=', status && status.modelCount);
  } catch (e) {
    console.log('status.query FAILED:', e && e.message);
  }
  try {
    const all = await c.osamah.opencode.liveModels.query({ offset: 0, limit: 30, zenFreeOnly: false });
    console.log('liveModels.state =', all && all.state, '| total =', all && all.total);
    console.log('models[0..2]:', (all && all.models || []).slice(0,3).map(m => m.modelName));
  } catch (e) {
    console.log('liveModels.query FAILED:', e && e.message);
    console.log('raw error:', JSON.stringify(e && e.data || e, null, 2).slice(0, 1200));
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error('UNCAUGHT:', e && e.stack || e); process.exit(1); });
