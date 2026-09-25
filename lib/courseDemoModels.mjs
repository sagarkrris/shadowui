// Small deterministic teaching models, not production networking implementations.
const frame = (title, explanation, cells) => ({ title, explanation, cells });
const cell = (label, value) => ({ label, value: String(value) });

function markChanges(frames) {
  return frames.map((current, index) => {
    const previous = new Map(frames[index - 1]?.cells.map(item => [item.label, item.value]));
    return { ...current, cells: current.cells.map(item => ({ ...item, active: index > 0 && previous.get(item.label) !== item.value })) };
  });
}

export function routingFrames({ policy = 'round-robin', capacity = 2, offline = false } = {}) {
  const weight = Math.max(1, Math.min(4, Number(capacity) || 1));
  const nodes = [{ id: 'A', weight, active: 0 }, { id: 'B', weight: 1, active: 0 }, { id: 'C', weight: 1, active: 0 }];
  const eligible = offline ? nodes.slice(0, 2) : nodes;
  const cells = () => nodes.map(n => cell(`Server ${n.id}`, `${n.active} assigned · capacity ${n.weight}${offline && n.id === 'C' ? ' · offline' : ''}`));
  const frames = [frame('No requests assigned', 'Eight requests will arrive before any completes. Capacity is a relative weight, not a hard limit.', cells())];
  for (let i = 0; i < 8; i++) {
    const chosen = policy === 'weighted-load'
      ? eligible.reduce((best, n) => n.active / n.weight < best.active / best.weight ? n : best)
      : eligible[i % eligible.length];
    const before = chosen.active;
    chosen.active++;
    frames.push(frame(`Request ${i + 1} → ${chosen.id}`, policy === 'weighted-load'
      ? `Before admission ${chosen.id} scored ${before}/${chosen.weight}. Choose the smallest active/capacity score; ties use A, B, C order. Counts are local to this model.`
      : 'Round robin advances over eligible servers. It ignores the capacity weights. Offline C is excluded when that scenario is selected.', cells()));
  }
  return markChanges(frames);
}

export function hashingFrames({ membership = 'add', hotKey = false } = {}) {
  const before = [{ id: 'A', at: 10 }, { id: 'B', at: 50 }, { id: 'C', at: 90 }];
  const after = membership === 'remove' ? before.filter(n => n.id !== 'B') : [...before, { id: 'D', at: 70 }].sort((a, b) => a.at - b.at);
  const keys = [5, 35, 65, 95];
  const owner = (key, ring) => (ring.find(n => n.at >= key) || ring[0]).id;
  const describe = ring => keys.map(key => cell(`Key ${key}${hotKey && key === 65 ? ' · 100 requests/s' : ' · 1 request/s'}`, `Owner ${owner(key, ring)}`));
  const moved = keys.filter(key => owner(key, before) !== owner(key, after));
  return markChanges([
    frame('Original ring: A=10, B=50, C=90', 'Tokens lie on 0–99. Choose the next token clockwise; key 95 wraps to A. Keys are already hashed in this toy model.', describe(before)),
    frame(membership === 'remove' ? 'Remove B at 50' : 'Add D at 70', membership === 'remove' ? 'The interval (10,50] changes from B to C. Other intervals keep their owner.' : 'The interval (50,70] changes from C to D. Other intervals keep their owner.', describe(after)),
    frame(`${moved.length} of ${keys.length} sample keys moved`, `Moved keys: ${moved.join(', ')}. ${hotKey ? 'Key 65 remains a hot key on one owner; stable placement does not balance its request rate.' : 'This is sample placement, not an estimate of production remapping percentages.'}`, describe(after)),
    frame('Placement is not data migration', 'The new owner must refill or obtain data under a separate recovery contract. Affinity alone does not preserve session state.', describe(after)),
  ]);
}

export function replayFrames({ expired = false } = {}) {
  const state = (applied, retained, connection) => [cell('Client cursor', applied), cell('Server history', retained), cell('Connection', connection)];
  return markChanges([
    frame('Client applied event 71', 'The cursor denotes the last event applied in this teaching model. Browser SSE reception alone is not a durable business acknowledgment.', state(71, '71', 'connected')),
    frame('Disconnect before event 72', 'The server commits event 72 while the client is offline. Transport reconnection cannot reconstruct missing history by itself.', state(71, '71, 72', 'offline')),
    frame('Reconnect with cursor 71', expired ? 'Retention now begins at 80. The server cannot replay the missing range and must explicitly reset the view.' : 'Event 72 is still retained. The authorized replay request asks for events strictly after 71.', state(71, expired ? '80, 81' : '71, 72', 'reconnecting')),
    frame(expired ? 'Install snapshot through 81' : 'Apply replayed event 72', expired ? 'A consistent snapshot includes state through 81. Resume strictly after 81, with authorization rechecked.' : 'Apply event 72 and advance the cursor. Repeated delivery needs an idempotent view update.', state(expired ? 81 : 72, expired ? '80, 81' : '71, 72', 'connected')),
  ]);
}

export function traceFrames(demo, scenario = 0) {
  const variant = demo.scenarios[scenario] || demo.scenarios[0];
  return markChanges(variant.steps.map(([title, explanation, values]) => frame(title, explanation,
    demo.lanes.map((label, i) => cell(label, values[i])))));
}
