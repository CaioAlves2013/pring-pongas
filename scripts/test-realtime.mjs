import { createClient } from '@supabase/supabase-js';

const url = 'https://jvqxolwsluvxbmbjmudw.supabase.co';
const key = 'sb_publishable_Xw5MpItckpw-OGg9IZH98Q_H4XrDWcG';
const code = `TEST${Date.now().toString(36).slice(-4).toUpperCase()}`;
const a = createClient(url, key, { realtime: { params: { eventsPerSecond: 30 } } });
const b = createClient(url, key, { realtime: { params: { eventsPerSecond: 30 } } });
const channelA = a.channel(`test-${code}`, { config: { broadcast: { ack: true }, presence: { key: 'host' } } });
const channelB = b.channel(`test-${code}`, { config: { broadcast: { ack: true }, presence: { key: 'guest' } } });
let received = false;
channelB.on('broadcast', { event: 'ping' }, ({ payload }) => { if (payload?.ok === true) received = true; });
const subscribe = (channel, role) => new Promise((resolve, reject) => channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') { await channel.track({ role }); resolve(); }
  if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(status));
}));
await Promise.all([subscribe(channelA, 'host'), subscribe(channelB, 'guest')]);
await new Promise((resolve) => setTimeout(resolve, 600));
await channelA.send({ type: 'broadcast', event: 'ping', payload: { ok: true } });
await new Promise((resolve) => setTimeout(resolve, 600));
console.log(JSON.stringify({ code, presenceA: Object.keys(channelA.presenceState()).length, presenceB: Object.keys(channelB.presenceState()).length, broadcastReceived: received }));
await Promise.all([a.removeChannel(channelA), b.removeChannel(channelB)]);
if (!received) process.exitCode = 1;
