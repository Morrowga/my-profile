'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Headphones, Keyboard, Minus, Plus, RotateCcw } from 'lucide-react';
import { FROST } from '@/lib/styles';
import FlowDiagram, { type NodeState } from './FlowDiagram';
import { CHECKOUT_NODES as NODES, CHECKOUT_EDGES as EDGES } from './experiments';

/**
 * A checkout built for a rush. A small shop (cart + wizard) is simulated in the browser.
 * Before you place the order you choose what goes wrong: how many shoppers are online, and which
 * browser-side and server-side problems happen. "Place order" then shows the journey of that order
 * across the services, slowly, with what each service is responsible for.
 * Nothing leaves the browser: no real order, no real payment.
 */

type OrderState = 'CART' | 'CHECKOUT' | 'PENDING' | 'PAID' | 'CONFIRMED' | 'FAILED';
const ORDER_FLOW: OrderState[] = ['CART', 'CHECKOUT', 'PENDING', 'PAID', 'CONFIRMED'];

/** One stop of the request. `fail` ends the request there; `soft` is a hiccup the system recovers from. */
type Hop = { node: string; label: string; say?: string; ms?: number; fail?: string; soft?: string; after?: () => void };
type LogLine = { id: number; time: string; kind: 'req' | 'ok' | 'err' | 'info'; text: string };
type Result = { status: 'idle' | 'placing' | 'success' | 'error'; orderId?: string; message?: string };
type View = 'shop' | 'trace';

type Traffic = 'quiet' | 'busy' | 'flash';
const TRAFFIC: { id: Traffic; label: string; shoppers: string }[] = [
  { id: 'quiet', label: 'Quiet', shoppers: '10 shoppers' },
  { id: 'busy', label: 'Busy', shoppers: '1,000 shoppers' },
  { id: 'flash', label: 'Flash sale', shoppers: '20,000 shoppers' },
];

type Opts = {
  doubleClick: boolean; dropped: boolean; refresh: boolean; slow: boolean;                                    // browser
  soldOut: boolean; priceChange: boolean; expired: boolean; declined: boolean; timeout: boolean; dbSlow: boolean; dupEvent: boolean; // server
};
const NO_PROBLEMS: Opts = {
  doubleClick: false, dropped: false, refresh: false, slow: false,
  soldOut: false, priceChange: false, expired: false, declined: false, timeout: false, dbSlow: false, dupEvent: false,
};
const GROUPS: { title: string; hint: string; items: { key: keyof Opts; text: string }[] }[] = [
  {
    title: 'Browser', hint: 'frontend problems',
    items: [
      { key: 'doubleClick', text: 'Double click' },
      { key: 'dropped', text: 'Connection drops' },
      { key: 'refresh', text: 'Page refresh mid-payment' },
      { key: 'slow', text: 'Slow network' },
    ],
  },
  {
    title: 'Server', hint: 'backend problems',
    items: [
      { key: 'soldOut', text: 'Last item sells out' },
      { key: 'priceChange', text: 'Price changes' },
      { key: 'expired', text: 'Reservation expired' },
      { key: 'declined', text: 'Card is declined' },
      { key: 'timeout', text: 'Payment provider times out' },
      { key: 'dbSlow', text: 'Database is slow' },
      { key: 'dupEvent', text: 'Duplicate payment event' },
    ],
  },
];

const STEPS = ['Cart', 'Details', 'Payment', 'Review'];
const BASE_PRICES = { hp: 89, kb: 129 };
const NODE_BY_ID = Object.fromEntries(NODES.map(n => [n.id, n]));
const fmt = (n: number) => `$${n.toFixed(2)}`;
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const stamp = () => new Date().toISOString().slice(11, 23);
// Small helpers for things that are random: they run only when the shopper clicks, never while drawing.
const jitter = () => 0.9 + Math.random() * 0.25;
const randInt = (n: number) => Math.floor(Math.random() * n);
const newOrderId = () => `#${1040 + randInt(60)}`;
const newKey = () => `idem_${Math.random().toString(36).slice(2, 8)}`;
const RED = '#ff6b6b';

const input: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.9rem', borderRadius: 8, color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
};
const label: React.CSSProperties = { display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 };
const primary: React.CSSProperties = {
  padding: '0.8rem 1.4rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.9rem',
  background: 'var(--accent)', color: '#050508',
};
const ghost: React.CSSProperties = {
  padding: '0.8rem 1.2rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff',
};
const panel: React.CSSProperties = { ...FROST, borderRadius: 20 };

/** A switch-like pill for the control panel. */
function Chip({ on, text, onClick }: { on: boolean; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={{
        ...FROST, padding: '0.45rem 0.9rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem',
        color: on ? '#fff' : 'var(--muted)', border: `1px solid ${on ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
        boxShadow: on ? '0 0 14px var(--glow)' : 'none', transition: 'all 0.2s',
      }}
    >
      {on ? '● ' : '○ '}{text}
    </button>
  );
}

export default function CheckoutDemo() {
  // ── what the shopper sees ──
  const [step, setStep] = useState(0);
  const [qty, setQty] = useState({ hp: 1, kb: 1 });
  const [prices, setPrices] = useState(BASE_PRICES);
  const [form, setForm] = useState({ name: 'Demo Shopper', email: 'demo@example.com', address: '12 Demo Street, Bangkok', card: '4242 4242 4242 4242', exp: '12 / 34', cvc: '123' });
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<Result>({ status: 'idle' });
  // The shop and the order's journey are shown one at a time: the journey appears when you place the order.
  const [view, setView] = useState<View>('shop');

  // ── what goes wrong (chosen before placing the order) ──
  const [traffic, setTraffic] = useState<Traffic>('quiet');
  const [opts, setOpts] = useState<Opts>(NO_PROBLEMS);

  // ── what the system does ──
  const [orderState, setOrderState] = useState<OrderState>('CART');
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});
  const [edgeStates, setEdgeStates] = useState<Record<string, NodeState>>({});
  const [now, setNow] = useState<{ title: string; text: string } | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const [duplicates, setDuplicates] = useState(0);

  const optsRef = useRef(opts);
  const trafficRef = useRef(traffic);
  const runId = useRef(0);
  const logId = useRef(0);
  const logBox = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastView = useRef<View>('shop');
  useEffect(() => { optsRef.current = opts; }, [opts]);
  useEffect(() => { trafficRef.current = traffic; }, [traffic]);
  useEffect(() => { if (logBox.current) logBox.current.scrollTop = logBox.current.scrollHeight; }, [log]);
  // When the screen switches between the shop and the journey, bring the top of the demo into view.
  useEffect(() => {
    if (lastView.current === view) return;
    lastView.current = view;
    rootRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [view]);

  const addLog = (kind: LogLine['kind'], text: string) =>
    setLog(l => [...l.slice(-80), { id: ++logId.current, time: stamp(), kind, text }]);

  /** Send one request through the services, one stop at a time. */
  const trace = async (method: string, path: string, hops: Hop[], extra = ''): Promise<{ ok: boolean; code?: string }> => {
    const id = ++runId.current;
    const speed = optsRef.current.slow ? 1.8 : 1;
    setNodeStates({ browser: 'active' });
    setEdgeStates({});
    setNow({ title: NODE_BY_ID.browser.label, text: 'The shopper pressed "Place order". The browser disables the button and sends the request with a fresh idempotency key.' });
    addLog('req', `${method} ${path}${extra ? `   ${extra}` : ''}`);
    await sleep(1100 * speed);
    if (runId.current !== id) return { ok: false, code: 'cancelled' };
    setNodeStates({ browser: 'done' });

    let prev = 'browser';
    let hiccupArrow = '';   // the arrow that turned red at the last hiccup; it goes back to normal once the system recovers
    for (const hop of hops) {
      const key = `${prev}>${hop.node}`;
      setEdgeStates(s => ({ ...s, [key]: 'active' }));
      setNodeStates(s => ({ ...s, [hop.node]: 'active' }));
      setNow({ title: NODE_BY_ID[hop.node].label, text: hop.say ?? NODE_BY_ID[hop.node].note });
      const ms = Math.round((hop.ms ?? 1100) * speed * jitter());
      await sleep(ms);
      if (runId.current !== id) return { ok: false, code: 'cancelled' };
      if (hop.fail || hop.soft) {
        setEdgeStates(s => ({ ...s, [key]: 'error' }));
        setNodeStates(s => ({ ...s, [hop.node]: 'error' }));
        addLog('err', `${hop.label}   ${hop.fail ? '✗ ' + hop.fail : '⚠ ' + hop.soft}   ${ms}ms`);
        if (hop.fail) { setNow(null); return { ok: false, code: hop.fail }; }
        hiccupArrow = key;
        prev = hop.node;   // a hiccup: the system recovers on the next stop
        continue;
      }
      const recovered = hiccupArrow;   // copy it now: React runs the update below a moment later
      hiccupArrow = '';
      setEdgeStates(s => ({ ...s, [key]: 'done', ...(recovered ? { [recovered]: 'done' as NodeState } : {}) }));
      setNodeStates(s => ({ ...s, [hop.node]: 'done' }));
      addLog('ok', `${hop.label}   ✓ ${ms}ms`);
      hop.after?.();
      prev = hop.node;
    }
    setNow(null);
    return { ok: true };
  };

  // ── the shop ──
  const lines = [
    { id: 'hp' as const, name: 'Wireless Headphones', Icon: Headphones, price: prices.hp, qty: qty.hp },
    { id: 'kb' as const, name: 'Mechanical Keyboard', Icon: Keyboard, price: prices.kb, qty: qty.kb },
  ];
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = 6;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shipping + tax;

  const changeQty = (id: 'hp' | 'kb', delta: number) => {
    const next = Math.min(5, Math.max(1, qty[id] + delta));
    if (next !== qty[id]) setQty(q => ({ ...q, [id]: next }));
  };

  const goCheckout = () => {
    setStep(1);
    setOrderState('CHECKOUT');
  };

  const goPayment = () => {
    if (!form.name.trim() || !form.address.trim() || !form.email.includes('@')) { setFormError('Please fill in your name, a valid email and your address.'); return; }
    setFormError('');
    setStep(2);
  };

  const goReview = () => {
    if (form.card.replace(/\D/g, '').length < 12 || !form.cvc.trim()) { setFormError('Please enter a card number and CVC (the test card is already filled in).'); return; }
    setFormError('');
    setStep(3);
  };

  /** The stops of the order request, depending on traffic and on what the shopper chose to break. */
  const hopsFor = (o: Opts, tr: Traffic, orderId: string): Hop[] => {
    const hops: Hop[] = [];
    const place = (1200 + randInt(8000)).toLocaleString('en-US');
    const instances = tr === 'flash' ? 12 : tr === 'busy' ? 4 : 1;

    // 1 · the front door
    if (tr === 'flash') {
      hops.push({
        node: 'gateway', ms: 1200, soft: '429 Too Many Requests · Retry-After: 2s',
        label: 'API gateway · too many shoppers right now',
        say: '20,000 shoppers are at the sale at the same moment. The front door only lets in what the system can serve and answers everyone else quickly with "429, slow down" and how long to wait. It does not pile up endless work.',
      });
      hops.push({
        node: 'browser', ms: 1800,
        label: 'Your browser · waits 2 seconds plus a random delay, then tries again with the same key',
        say: 'The browser does not keep hammering. It waits as long as the server asked, adds a random delay so thousands of browsers do not all come back in the same second, and retries with the same idempotency key.',
      });
      hops.push({
        node: 'gateway', ms: 1300,
        label: `API gateway · let in from the waiting room (you were #${place} of 20,000)`,
        say: 'The waiting room lets shoppers in one after another, at a speed the system can handle. Now it is your turn. The idempotency key is recorded, so a repeat can never create a second order.',
      });
    } else {
      hops.push({
        node: 'gateway', ms: 1100,
        label: tr === 'busy' ? 'API gateway · 1,000 shoppers online · within the rate limit · key recorded' : 'API gateway · rate limit ok · idempotency key recorded',
      });
    }

    // 2 · the order
    hops.push({
      node: 'order', ms: 1200,
      label: `Order service · order ${orderId} created as PENDING${instances > 1 ? ` · ${instances} instances running` : ''}`,
      say: instances > 1
        ? `Creates the order and owns its states. With ${tr === 'flash' ? '20,000' : '1,000'} shoppers online the service has been scaled out to ${instances} instances, because it keeps no state of its own.`
        : undefined,
      after: () => setOrderState('PENDING'),
    });

    // 3 · prices
    hops.push({
      node: 'price', ms: 1100, label: 'Price service · every price checked again',
      fail: o.priceChange && prices.kb === BASE_PRICES.kb ? 'price_changed' : undefined,
    });

    // 4 · stock
    if (o.expired) {
      hops.push({
        node: 'stock', ms: 1200, soft: 'reservation expired',
        label: 'Inventory · your 10-minute reservation had expired',
        say: 'The shopper took too long, so the items went back on the shelf. The server notices, instead of selling something it no longer holds.',
      });
    }
    hops.push({
      node: 'stock', ms: 1200, fail: o.soldOut ? 'out_of_stock' : undefined,
      label: o.soldOut
        ? 'Inventory · someone else took the last item'
        : o.expired ? 'Inventory · the items were still free: reserved again'
        : tr === 'flash' ? 'Inventory · one atomic step decided who gets the last items: you got one'
        : 'Inventory · items taken from the counter',
    });

    // 5 · payment
    if (o.timeout) {
      hops.push({
        node: 'payment', ms: 1900, soft: 'no answer after 5 seconds (timeout)',
        label: 'Payment provider · did not answer in time',
        say: 'The provider is slow. The server does NOT guess "failed", because the card may already have been charged, and it does NOT charge again. The order stays PENDING.',
      });
      hops.push({
        node: 'payment', ms: 1600, fail: o.declined ? 'card_declined' : undefined,
        label: o.declined ? 'Payment provider · asked again with the same payment key: the card was declined' : `Payment provider · asked again with the same payment key: the first charge had gone through, charged once (${fmt(total)})`,
        say: 'Asking again with the same key is safe. The provider answers with the result of the first try instead of charging a second time.',
        after: () => setOrderState('PAID'),
      });
    } else {
      hops.push({
        node: 'payment', ms: 1700, fail: o.declined ? 'card_declined' : undefined,
        label: `Payment provider · charged ${fmt(total)} (test card)`, after: () => setOrderState('PAID'),
      });
    }

    // browser problem: the page is refreshed while the payment runs
    if (o.refresh) {
      hops.push({
        node: 'browser', ms: 1300, soft: 'page reloaded',
        label: 'Your browser · the page was refreshed while the payment was running',
        say: 'The shopper presses refresh or the back button. All the memory of the page is gone, but the order id is in the page address, so nothing is lost.',
      });
      hops.push({ node: 'gateway', ms: 1000, label: `API gateway · "what happened to order ${orderId}?" let through`, say: 'The page asks the server what happened instead of starting again. Starting again would risk a second order.' });
      hops.push({ node: 'order', ms: 1100, label: `Order service · order ${orderId} is PAID. The page shows it, and the shopper is not charged twice` });
    }

    // 6 · the database
    if (o.dbSlow) {
      hops.push({
        node: 'db', ms: 2000, soft: 'query timed out after 2 seconds', label: 'Orders DB · too slow to answer',
        say: 'Under heavy load the database is slow. The order service never waits forever: every database call has a timeout.',
      });
      hops.push({ node: 'db', ms: 1300, label: 'Orders DB · retry after 0.5 seconds plus a random delay: order saved as PAID (a retry is safe because of the key)' });
    } else {
      hops.push({ node: 'db', ms: 1100, label: 'Orders DB · order saved as PAID' });
    }

    // 7 · events
    hops.push({ node: 'events', ms: 1100, label: 'Events · receipt email queued', after: () => setOrderState('CONFIRMED') });
    if (o.dupEvent) {
      hops.push({
        node: 'events', ms: 1300, label: 'Events · the payment provider sent "payment succeeded" a second time: same event id, ignored',
        say: 'Providers can send the same event more than once. The event id is stored, so a repeat does nothing: no second email and no second update.',
      });
    }

    // browser problem: the answer never arrives
    if (o.dropped) {
      hops.push({
        node: 'browser', ms: 1300, soft: 'connection lost',
        label: 'Your browser · the connection dropped before the answer arrived',
        say: 'The server finished the order, but the answer never reached the shopper (a tunnel, weak Wi-Fi). The shopper sees nothing and could be tempted to pay again.',
      });
      hops.push({ node: 'browser', ms: 1000, label: 'Your browser · reconnected, sends the same request again with the same key' });
      hops.push({ node: 'gateway', ms: 1000, label: 'API gateway · the same idempotency key is seen again' });
      hops.push({ node: 'order', ms: 1100, label: `Order service · found it: order ${orderId} is CONFIRMED. The same order is returned, no second charge` });
    }
    return hops;
  };

  const placeOrder = async () => {
    if (result.status === 'placing') return;
    const o = optsRef.current;
    const tr = trafficRef.current;
    const orderId = newOrderId();
    const idem = newKey();
    setNotice('');
    setResult({ status: 'placing' });
    setNodeStates({}); setEdgeStates({}); setLog([]); setDuplicates(0);
    setOrderState('CHECKOUT');
    setView('trace');

    // "Double click": the same request is sent a second time. The idempotency key makes it harmless.
    if (o.doubleClick) {
      setTimeout(() => {
        addLog('req', `POST /orders   Idempotency-Key: ${idem}   (second click)`);
        setTimeout(() => {
          addLog('ok', `Order service · key already seen → returned order ${orderId}. No second order, no second charge`);
          setDuplicates(d => d + 1);
        }, 700);
      }, 1500);
    }

    const r = await trace('POST', '/orders', hopsFor(o, tr, orderId), `Idempotency-Key: ${idem}`);

    if (r.code === 'cancelled') return;
    if (r.ok) { setResult({ status: 'success', orderId }); return; }

    // something failed: say what the system does about it
    const fail = (text: string) => { setNotice(text); setResult({ status: 'error', message: text }); };
    if (r.code === 'price_changed') {
      addLog('info', 'Order service · order cancelled before any charge');
      setPrices(p => ({ ...p, kb: 139 }));
      setOrderState('CHECKOUT');
      fail('The price of the Mechanical Keyboard changed to $139.00. Please check your order and try again.');
    } else if (r.code === 'out_of_stock') {
      addLog('info', 'Order service · order cancelled, nothing charged');
      setOrderState('CHECKOUT');
      fail('Sorry, an item just sold out. You were not charged.');
    } else if (r.code === 'card_declined') {
      addLog('info', 'Inventory · reservation released');
      setOrderState('FAILED');
      fail('Your card was declined. You were not charged. Please try another card.');
    }
  };

  const reset = () => {
    runId.current++;
    setView('shop'); setStep(0); setQty({ hp: 1, kb: 1 }); setPrices(BASE_PRICES); setFormError(''); setNotice(''); setResult({ status: 'idle' });
    setOrderState('CART'); setNodeStates({}); setEdgeStates({}); setNow(null); setLog([]); setDuplicates(0);
  };

  /** Back to the shop after a failed order, keeping what was typed and chosen. */
  const backToCheckout = () => {
    runId.current++;
    setView('shop'); setResult({ status: 'idle' });
    setNodeStates({}); setEdgeStates({}); setNow(null); setLog([]); setDuplicates(0); setOrderState('CHECKOUT');
  };

  const activeScenarios = [
    ...(traffic !== 'quiet' ? [`${TRAFFIC.find(t => t.id === traffic)!.label} (${TRAFFIC.find(t => t.id === traffic)!.shoppers})`] : []),
    ...GROUPS.flatMap(g => g.items.filter(i => opts[i.key]).map(i => i.text)),
  ];

  return (
    <div ref={rootRef} style={{ display: 'grid', gap: '1.25rem', scrollMarginTop: '6rem' }}>
      {view === 'shop' ? (
        <>
          {/* ───────────── control panel: what goes wrong ───────────── */}
          <div style={{ ...panel, padding: '1.25rem 1.5rem', display: 'grid', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Try breaking it</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.84rem', marginTop: 4, lineHeight: 1.6 }}>
                Choose how busy the shop is and what goes wrong, then place an order. You will see how the browser and the server each deal with it.
              </p>
            </div>

            <div className="scenario-row">
              <span className="mono scenario-label">Traffic<small>shoppers online</small></span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {TRAFFIC.map(t => {
                  const on = traffic === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setTraffic(t.id)}
                      style={{
                        ...FROST, padding: '0.45rem 0.95rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', textAlign: 'left',
                        color: on ? '#fff' : 'var(--muted)', border: `1px solid ${on ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
                        boxShadow: on ? '0 0 14px var(--glow)' : 'none', transition: 'all 0.2s',
                      }}
                    >
                      <strong>{t.label}</strong> <span className="mono" style={{ opacity: 0.75, marginLeft: 6 }}>{t.shoppers}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {GROUPS.map(g => (
              <div key={g.title} className="scenario-row">
                <span className="mono scenario-label">{g.title}<small>{g.hint}</small></span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {g.items.map(i => (
                    <Chip key={i.key} on={opts[i.key]} text={i.text} onClick={() => setOpts(o => ({ ...o, [i.key]: !o[i.key] }))} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ───────────── the shop ───────────── */}
          <div className="checkout-grid">
            <div style={{ ...panel, padding: '1.5rem' }}>
              {/* step indicator */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {STEPS.map((s, i) => (
                  <span key={s} className="mono" style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.8rem', borderRadius: 999, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: i === step ? '#fff' : 'var(--muted)', border: `1px solid ${i === step ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
                    background: i === step ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
                  }}>
                    <span style={{ color: i <= step ? 'var(--accent)' : 'inherit' }}>{i < step ? '✓' : i + 1}</span> {s}
                  </span>
                ))}
              </div>

              {notice && (
                <div role="alert" style={{ marginBottom: '1.2rem', padding: '0.8rem 1rem', borderRadius: 10, fontSize: '0.88rem', lineHeight: 1.6, color: '#ffd9d9', background: 'rgba(255,107,107,0.12)', border: `1px solid ${RED}66` }}>
                  {notice}
                </div>
              )}

              {step === 0 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {lines.map(l => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}>
                        <l.Icon size={26} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: '#fff' }}>{l.name}</p>
                        <p className="mono" style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 3 }}>{fmt(l.price)} each</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button type="button" aria-label={`Less ${l.name}`} onClick={() => changeQty(l.id, -1)} style={{ ...ghost, padding: '0.4rem' }}><Minus size={14} /></button>
                        <span className="mono" style={{ minWidth: 18, textAlign: 'center' }}>{l.qty}</span>
                        <button type="button" aria-label={`More ${l.name}`} onClick={() => changeQty(l.id, 1)} style={{ ...ghost, padding: '0.4rem' }}><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="button" style={primary} onClick={goCheckout}>Checkout →</button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div><label style={label} htmlFor="co-name">Full name</label><input id="co-name" style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label style={label} htmlFor="co-email">Email</label><input id="co-email" type="email" style={input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><label style={label} htmlFor="co-addr">Address</label><input id="co-addr" style={input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                  {formError && <p role="alert" style={{ color: RED, fontSize: '0.85rem' }}>{formError}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <button type="button" style={ghost} onClick={() => setStep(0)}>← Back</button>
                    <button type="button" style={primary} onClick={goPayment}>Continue →</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div><label style={label} htmlFor="co-card">Card number (test card)</label><input id="co-card" className="mono" style={input} value={form.card} onChange={e => setForm({ ...form, card: e.target.value })} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><label style={label} htmlFor="co-exp">Expiry</label><input id="co-exp" className="mono" style={input} value={form.exp} onChange={e => setForm({ ...form, exp: e.target.value })} /></div>
                    <div><label style={label} htmlFor="co-cvc">CVC</label><input id="co-cvc" className="mono" style={input} value={form.cvc} onChange={e => setForm({ ...form, cvc: e.target.value })} /></div>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>This is a test card. Nothing is charged, and nothing is sent anywhere.</p>
                  {formError && <p role="alert" style={{ color: RED, fontSize: '0.85rem' }}>{formError}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <button type="button" style={ghost} onClick={() => setStep(1)}>← Back</button>
                    <button type="button" style={primary} onClick={goReview}>Review order →</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', lineHeight: 1.8, fontSize: '0.9rem' }}>
                    <p><span style={{ color: 'var(--muted)' }}>Ship to </span>{form.name}, {form.address}</p>
                    <p><span style={{ color: 'var(--muted)' }}>Receipt to </span>{form.email}</p>
                    <p><span style={{ color: 'var(--muted)' }}>Pay with </span>card ending {form.card.replace(/\D/g, '').slice(-4)}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <button type="button" style={ghost} onClick={() => setStep(2)}>← Back</button>
                    <button type="button" style={primary} onClick={placeOrder}>{`Place order · ${fmt(total)}`}</button>
                  </div>
                </div>
              )}
            </div>

            {/* order summary: always visible */}
            <aside style={{ ...panel, padding: '1.5rem', alignSelf: 'start' }}>
              <h3 className="mono" style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '1rem' }}>Order summary</h3>
              <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.9rem' }}>
                {lines.map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.82)' }}>{l.qty} × {l.name}</span><span className="mono">{fmt(l.price * l.qty)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><span>Shipping</span><span className="mono">{fmt(shipping)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><span>Tax (8%)</span><span className="mono">{fmt(tax)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', paddingTop: '0.7rem', borderTop: '1px solid rgba(255,255,255,0.14)' }}>
                  <span>Total</span><span className="mono">{fmt(total)}</span>
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <div style={{ ...panel, padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Your order&apos;s journey</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>Each service lights up as your request reaches it. The job of each service is written on it.</p>
            </div>
            <span className="mono" style={{ fontSize: '0.66rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Simulated in your browser</span>
          </div>
          <p className="mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
            Scenarios: {activeScenarios.length ? activeScenarios.join(' · ') : 'nothing broken, a normal day'}
          </p>

          {/* what happened to the order */}
          {result.status === 'placing' && (
            <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', padding: '0.8rem 1rem', borderRadius: 12, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' }}>
              <span className="spin-ring" style={{ width: 20, height: 20, borderWidth: 2.5 }} /> <span style={{ fontWeight: 700 }}>Placing your order…</span>
            </div>
          )}
          {result.status === 'success' && (
            <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', padding: '0.9rem 1.1rem', borderRadius: 12, background: 'color-mix(in srgb, var(--accent) 12%, transparent)', border: '1px solid var(--accent)' }}>
              <Check size={22} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span><strong>Order {result.orderId} confirmed.</strong> <span style={{ color: 'rgba(255,255,255,0.78)' }}>A receipt was sent to {form.email}.</span></span>
            </div>
          )}
          {result.status === 'error' && (
            <div role="alert" style={{ marginBottom: '1rem', padding: '0.9rem 1.1rem', borderRadius: 12, lineHeight: 1.6, color: '#ffd9d9', background: 'rgba(255,107,107,0.12)', border: `1px solid ${RED}66` }}>
              {result.message}
            </div>
          )}

          <FlowDiagram nodes={NODES} edges={EDGES} nodeStates={nodeStates} edgeStates={edgeStates} />

          {/* what the active service is doing, and why */}
          <div style={{ ...FROST, borderRadius: 14, padding: '1rem 1.2rem', marginTop: '1rem', minHeight: 96 }}>
            {now ? (
              <>
                <p className="mono" style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)' }}>Now · {now.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.88)', lineHeight: 1.7, fontSize: '0.92rem', marginTop: 6 }}>{now.text}</p>
              </>
            ) : (
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '0.92rem' }}>
                {result.status === 'placing' ? 'Starting…' : 'The request has finished. Read the log below to see every step, or go on.'}
              </p>
            )}
          </div>

          {/* order states */}
          <div style={{ marginTop: '1.2rem' }}>
            <p className="mono" style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.6rem' }}>Order state</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {ORDER_FLOW.map((s, i) => {
                const idx = ORDER_FLOW.indexOf(orderState);
                const here = orderState === s;
                const passed = orderState !== 'FAILED' && i < idx;
                return (
                  <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="mono" style={{
                      padding: '0.3rem 0.7rem', borderRadius: 6, fontSize: '0.72rem', letterSpacing: '0.06em',
                      color: here ? '#050508' : passed ? '#fff' : 'var(--muted)',
                      background: here ? 'var(--accent)' : passed ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${here || passed ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`, fontWeight: here ? 800 : 500,
                    }}>{s}</span>
                    {i < ORDER_FLOW.length - 1 && <span style={{ color: 'var(--muted)' }}>→</span>}
                  </span>
                );
              })}
              {orderState === 'FAILED' && (
                <span className="mono" style={{ marginLeft: '0.6rem', padding: '0.3rem 0.7rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800, color: '#050508', background: RED }}>FAILED</span>
              )}
            </div>
          </div>

          {/* request log */}
          <div style={{ marginTop: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <p className="mono" style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>Request log</p>
              {duplicates > 0 && (
                <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mono" style={{ fontSize: '0.68rem', color: 'var(--accent)' }}>
                  duplicate requests blocked: {duplicates}
                </motion.span>
              )}
            </div>
            <div
              ref={logBox}
              role="log"
              aria-live="polite"
              className="mono"
              style={{ maxHeight: 260, minHeight: 90, overflowY: 'auto', padding: '0.9rem 1rem', borderRadius: 12, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.74rem', lineHeight: 1.85 }}
            >
              {log.length === 0 && <span style={{ color: 'var(--muted)' }}>Waiting for the first request…</span>}
              {log.map(l => (
                <div key={l.id} style={{ color: l.kind === 'err' ? RED : l.kind === 'req' ? 'var(--accent)' : l.kind === 'info' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.86)', fontWeight: l.kind === 'req' ? 700 : 400 }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>{l.time}  </span>{l.kind === 'req' ? '→ ' : '   '}{l.text}
                </div>
              ))}
            </div>
          </div>

          {/* next step */}
          {(result.status === 'success' || result.status === 'error') && (
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1.4rem' }}>
              {result.status === 'error' && <button type="button" style={primary} onClick={backToCheckout}>← Back to checkout</button>}
              <button type="button" style={result.status === 'error' ? ghost : primary} onClick={reset}>
                <RotateCcw size={14} style={{ verticalAlign: -2, marginRight: 8 }} />Start over
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
