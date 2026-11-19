import {
  Bell, Boxes, Cpu, CreditCard, Database, Gauge, Globe, Inbox, Layers, ListOrdered, Monitor, ShieldCheck,
  RefreshCw, Server, ShoppingCart, Timer, Users, Webhook, Zap, CalendarCheck, Workflow,
  type LucideIcon,
} from 'lucide-react';

/**
 * ── Lab experiments ─────────────────────────────────────────────────────────
 * REFERENCE DESIGNS: how I would build each system. Read and edit the text so it
 * matches what you want to claim.
 *
 * node  x, y  = position in percent (0–100) on the diagram
 * step  nodes = the nodes that light up in that step; an arrow lights up when
 *               both of its ends are in the list
 */
export type ExpNode = {
  id: string; label: string; icon: LucideIcon; x: number; y: number;
  note: string;      // longer explanation (shown while the service is working)
  role?: string;     // short job description, printed under the name on the diagram
};
export type ExpStep = { title: string; text: string; nodes: string[] };
export type Experiment = {
  id: string;
  title: string;
  icon: LucideIcon;
  proves: string;            // one line on the card
  summary: string;           // intro on the detail page
  techniques: string[];
  nodes: ExpNode[];
  edges: [string, string][];
  steps: ExpStep[];
  cases: string[];           // test cases I would run in the live version
};

/** The checkout's services. Used by the interactive demo and by the Architecture tab. */
export const CHECKOUT_NODES: ExpNode[] = [
  { id: 'browser', label: 'Your browser', icon: Monitor, x: 10, y: 22, role: 'Blocks double clicks, retries politely', note: 'The frontend. It disables the button after one click, keeps the idempotency key, and when the server says "slow down" it waits and tries again with a random delay.' },
  { id: 'gateway', label: 'API gateway', icon: ShieldCheck, x: 30, y: 22, role: 'Rate limit, waiting room, key check', note: 'The front door. In a rush it lets in only as many shoppers as the system can serve, answers the rest quickly with "429 slow down", and remembers every idempotency key.' },
  { id: 'order', label: 'Order service', icon: Layers, x: 50, y: 22, role: 'Owns the order and its states', note: 'Creates the order and moves it through PENDING, PAID and CONFIRMED. It scales out by adding instances when traffic grows.' },
  { id: 'price', label: 'Price service', icon: Gauge, x: 70, y: 22, role: 'Only the server decides prices', note: 'Calculates every price again on the server. Whatever the browser shows is never trusted.' },
  { id: 'stock', label: 'Inventory', icon: Boxes, x: 90, y: 22, role: 'One atomic counter, no overselling', note: 'Takes items from a shared counter in one atomic step, so two shoppers can never get the last item together. Reservations expire after 10 minutes.' },
  { id: 'cart', label: 'Cart service', icon: ShoppingCart, x: 30, y: 78, role: 'Saves the cart, expires it', note: 'Keeps the cart on the server, so a refresh or another device does not lose it.' },
  { id: 'events', label: 'Events & email', icon: Bell, x: 50, y: 78, role: 'Receipts, never twice', note: 'Sends the receipt and tells other systems. Every event has an id, so a repeated event is ignored.' },
  { id: 'db', label: 'Orders DB', icon: Database, x: 70, y: 78, role: 'Source of truth, safe retries', note: 'Stores every order and its state. Writes have timeouts and are retried safely.' },
  { id: 'payment', label: 'Payment (test)', icon: CreditCard, x: 90, y: 78, role: 'Charges once, may not answer', note: 'A test payment provider. It can decline, or take too long to answer, and the system must be correct in both cases.' },
];
export const CHECKOUT_EDGES: [string, string][] = [
  ['browser', 'gateway'], ['gateway', 'order'], ['order', 'price'], ['price', 'stock'], ['stock', 'payment'],
  ['payment', 'db'], ['db', 'events'], ['gateway', 'cart'],
];

export const EXPERIMENTS: Experiment[] = [
  // ───────────────────────────── Flash sale ─────────────────────────────
  {
    id: 'flash-sale',
    title: 'Flash sale',
    icon: Zap,
    proves: '10,000 people, 100 items: fair entry and zero overselling.',
    summary:
      'A short sale sends a huge spike of traffic to a few items. The goal is simple: stay fast, treat everyone fairly, and never sell more than we have.',
    techniques: ['Edge cache', 'Rate limiting', 'Waiting room', 'Atomic stock counter', 'Async orders'],
    nodes: [
      { id: 'users', label: 'Visitors', icon: Users, x: 7, y: 50, note: 'Thousands of people arrive in the same second.' },
      { id: 'edge', label: 'Edge & bot filter', icon: Globe, x: 24, y: 50, note: 'Serves the sale page from cache and blocks bots, so the origin never sees most of the traffic.' },
      { id: 'limiter', label: 'Rate limiter', icon: Gauge, x: 41, y: 20, note: 'A token bucket per visitor. Extra requests get a fast 429 with a Retry-After header.' },
      { id: 'waiting', label: 'Waiting room', icon: ListOrdered, x: 41, y: 80, note: 'Lets in only N people per second. The rest wait in a fair queue and see their place.' },
      { id: 'api', label: 'Sale API', icon: Server, x: 58, y: 50, note: 'Stateless servers that can scale out. They decide, but they hold no state.' },
      { id: 'stock', label: 'Stock counter', icon: Boxes, x: 76, y: 20, note: 'One atomic decrement (Redis DECR or a Lua script). It can never go below zero.' },
      { id: 'queue', label: 'Order queue', icon: Inbox, x: 76, y: 80, note: 'Orders wait here and are written at a steady speed.' },
      { id: 'db', label: 'Database', icon: Database, x: 93, y: 50, note: 'Sees a small, steady flow of writes, never the spike.' },
    ],
    edges: [['users', 'edge'], ['edge', 'limiter'], ['edge', 'waiting'], ['limiter', 'api'], ['waiting', 'api'], ['api', 'stock'], ['api', 'queue'], ['queue', 'db'], ['stock', 'db']],
    steps: [
      { title: 'A spike arrives', nodes: ['users', 'edge'], text: '10,000 people open the sale page in the same second. The page and images come from the edge cache and bots are filtered out, so the origin never sees most of this traffic.' },
      { title: 'Everyone gets a request budget', nodes: ['edge', 'limiter', 'api'], text: 'Each visitor has a small budget of requests per second (a token bucket). Anyone over budget gets a quick "slow down" answer instead of slowing everyone else.' },
      { title: 'Fair entry through a waiting room', nodes: ['edge', 'waiting', 'api'], text: 'Only as many people as the system can serve are let in each second. The others wait in a first-come queue and can see their place, so the API is never overloaded.' },
      { title: 'Reserve the stock atomically', nodes: ['api', 'stock'], text: 'The API takes one item from a shared counter in a single atomic step. Two people can never take the last item together, so the stock never goes below zero.' },
      { title: 'Create orders without flooding the database', nodes: ['api', 'queue', 'db'], text: 'A winner gets an order ticket right away. The order itself goes into a queue and is written to the database at a steady speed, so the spike never reaches it.' },
      { title: 'Sold out in milliseconds', nodes: ['users', 'edge', 'api', 'stock'], text: 'When the counter hits zero, a "sold out" flag is pushed to the edge cache. Everyone else gets an instant answer without touching the API at all.' },
    ],
    cases: [
      '10,000 virtual users, 100 items: exactly 100 orders and 0 oversold',
      'One visitor clicks 5 times: only 1 order (idempotency key)',
      'A worker crashes mid-order: the order is retried and not duplicated',
      'Traffic grows 10 times: latency stays flat, and the queue gets longer instead',
    ],
  },

  // ───────────────────────────── Booking ─────────────────────────────
  {
    id: 'booking',
    title: 'Booking',
    icon: CalendarCheck,
    proves: 'Many people want the same slot: one winner, no double booking.',
    summary:
      'Seats, tables or appointments are limited and everyone wants the best one. A short hold keeps it fair while people pay, and the database makes double booking impossible.',
    techniques: ['Temporary hold (TTL)', 'Atomic "set if free"', 'Unique constraint', 'Expiry job'],
    nodes: [
      { id: 'users', label: 'Visitors', icon: Users, x: 8, y: 50, note: 'Many people choose the same slot at the same time.' },
      { id: 'api', label: 'Booking API', icon: Server, x: 28, y: 50, note: 'Checks the request and asks for a hold. It keeps no state itself.' },
      { id: 'hold', label: 'Temporary hold', icon: Timer, x: 49, y: 20, note: 'A key with a time limit. Only the first request can create it; others see "taken".' },
      { id: 'expire', label: 'Hold expiry', icon: RefreshCw, x: 72, y: 20, note: 'If nobody pays in time, the hold ends and the slot is free again.' },
      { id: 'pay', label: 'Payment', icon: CreditCard, x: 49, y: 80, note: 'The visitor pays while the hold is still valid.' },
      { id: 'db', label: 'Bookings database', icon: Database, x: 72, y: 80, note: 'A unique rule on the slot is the last safety net: two bookings for one slot cannot exist.' },
      { id: 'notify', label: 'Confirmation', icon: Bell, x: 92, y: 50, note: 'Email and message sent after the booking is saved.' },
    ],
    edges: [['users', 'api'], ['api', 'hold'], ['api', 'pay'], ['hold', 'expire'], ['pay', 'db'], ['db', 'notify']],
    steps: [
      { title: 'Many people choose the same slot', nodes: ['users', 'api'], text: 'Hundreds of requests for one slot arrive within a second. The API stays stateless, so it can scale out without any risk of conflicts.' },
      { title: 'The first request gets a hold', nodes: ['api', 'hold'], text: 'An atomic "set if not exists" with a time limit decides the winner. Exactly one visitor gets the hold; everyone else instantly sees that the slot is taken.' },
      { title: 'Pay while the hold lasts', nodes: ['api', 'pay', 'db'], text: 'The winner has a few minutes to pay. During that time nobody else can take the slot, and nothing is saved to the database yet.' },
      { title: 'The database has the final say', nodes: ['pay', 'db', 'notify'], text: 'After payment, the booking is saved. A unique rule on the slot is the safety net: even if something goes wrong earlier, two bookings can never exist for one slot.' },
      { title: 'No payment? The slot comes back', nodes: ['hold', 'expire'], text: 'When the time runs out, the hold disappears by itself and the slot becomes available again, with no manual cleanup.' },
    ],
    cases: [
      '500 users pick the same slot: 1 hold, 499 "taken"',
      'The hold expires without payment: the slot is free again',
      'Double payment for one slot: only 1 booking is saved',
      'The server restarts during payment: the hold still stands',
    ],
  },

  // ───────────────────────────── Checkout ─────────────────────────────
  {
    id: 'checkout',
    title: 'Checkout',
    icon: ShoppingCart,
    proves: '20,000 shoppers, 3 items: fair, no double orders, no lost payments.',
    summary:
      'A normal cart works when three people use it. This one is built for a rush: thousands of shoppers, slow networks, repeated clicks, and a payment provider that sometimes does not answer. Turn the scenarios on and watch what the browser and the server each do.',
    techniques: ['Waiting room', 'Rate limit + retry with jitter', 'Idempotency key', 'Atomic stock counter', 'Timeouts + reconcile', 'Event de-duplication'],
    nodes: CHECKOUT_NODES,
    edges: CHECKOUT_EDGES,
    steps: [
      { title: 'The cart lives on the server', nodes: ['browser', 'gateway', 'cart'], text: 'The browser keeps only a cart id. The cart itself is saved on the server, so a refresh, a second tab or another device never loses it. An old cart expires, and its reserved stock is released.' },
      { title: 'A rush is controlled at the front door', nodes: ['browser', 'gateway'], text: 'In a rush the gateway lets in only as many shoppers as the system can serve, using a rate limit and a waiting room. The others get a quick "429 slow down" with a time to wait. The browser obeys, adds a random delay so thousands of browsers do not return together, and tries again.' },
      { title: 'Prices are decided by the server', nodes: ['gateway', 'order', 'price'], text: 'The order service asks the price service to calculate everything again. If a price changed since the cart was shown, the shopper is told before paying, never after.' },
      { title: 'Stock is taken in one atomic step', nodes: ['order', 'price', 'stock'], text: 'Items are taken from one shared counter in a single atomic step. With 20,000 shoppers and 3 items, exactly 3 win and nobody gets an item that is not there. Reservations expire, so abandoned carts give their items back.' },
      { title: 'One click means one order', nodes: ['browser', 'gateway', 'order'], text: 'The browser disables the button and sends an idempotency key. If the click is repeated, the connection drops or the page is refreshed, the same key returns the same order. There is never a second order or a second charge.' },
      { title: 'A slow payment is handled, not guessed', nodes: ['stock', 'payment', 'db'], text: 'If the payment provider does not answer in time, the order stays PENDING and is never marked failed by guessing. The system asks again with the same key, and the provider says whether the first charge went through. No double charge, no lost payment.' },
      { title: 'Confirm and tell everyone, once', nodes: ['payment', 'db', 'events'], text: 'The order is saved as PAID with safe retries if the database is slow. The receipt event carries an id, so even if the provider sends "payment succeeded" twice, the shopper gets one email.' },
    ],
    cases: [
      'Traffic: 20,000 shoppers at once. 429 + waiting room, the browser retries, the order still goes through',
      'Browser: double click. One order, one charge',
      'Browser: the connection drops after the order was made. The browser asks again and gets the same order',
      'Browser: page refresh while paying. The order is found again from its id',
      'Server: the last item sells out. A clear message and no charge',
      'Server: the price changed. The shopper is told before paying',
      'Server: the payment provider times out. The order waits, the same key is used again, only one charge',
      'Server: slow database and duplicate payment events. Safe retries, one email',
    ],
  },

  // ───────────────────────────── Payment ─────────────────────────────
  {
    id: 'payment',
    title: 'Payment (Stripe)',
    icon: CreditCard,
    proves: 'Safe card payments: no double charges, even when messages repeat.',
    summary:
      'Payments must be exact. Card data goes straight to Stripe, results come back as signed webhooks, and every step can be repeated safely.',
    techniques: ['PaymentIntent', 'Idempotency key', 'Signed webhooks', 'Event queue', 'Event de-duplication'],
    nodes: [
      { id: 'users', label: 'Checkout page', icon: Users, x: 7, y: 50, note: 'Shows the card form. The card details never touch my server.' },
      { id: 'api', label: 'My API', icon: Server, x: 27, y: 22, note: 'Creates the payment with an idempotency key and knows the amount from the server.' },
      { id: 'stripe', label: 'Stripe', icon: CreditCard, x: 50, y: 50, note: 'Handles the card, the bank and the extra verification step (3D Secure).' },
      { id: 'webhook', label: 'Webhook endpoint', icon: Webhook, x: 73, y: 22, note: 'Receives signed events from Stripe and checks the signature first.' },
      { id: 'queue', label: 'Event queue', icon: Inbox, x: 73, y: 78, note: 'Events wait here, so the endpoint can answer in milliseconds.' },
      { id: 'db', label: 'Orders DB', icon: Database, x: 93, y: 50, note: 'The order is marked "paid" exactly once.' },
    ],
    edges: [['users', 'api'], ['users', 'stripe'], ['api', 'stripe'], ['stripe', 'webhook'], ['webhook', 'queue'], ['queue', 'db']],
    steps: [
      { title: 'Create the payment safely', nodes: ['users', 'api', 'stripe'], text: 'My API creates a payment with Stripe using an idempotency key. If the request is repeated, Stripe returns the same payment, not a new one.' },
      { title: 'Card details skip my server', nodes: ['users', 'stripe'], text: 'The browser sends the card straight to Stripe. My server never sees the number, which keeps the security and compliance work small.' },
      { title: 'Stripe reports the result', nodes: ['stripe', 'webhook'], text: 'Stripe sends a signed event. The endpoint checks the signature before it trusts anything, so a fake call cannot mark an order as paid.' },
      { title: 'Answer fast, work later', nodes: ['webhook', 'queue'], text: 'The endpoint puts the event on a queue and replies right away. If my side is slow or down, Stripe simply retries later.' },
      { title: 'Update the order exactly once', nodes: ['queue', 'db'], text: 'A worker marks the order paid. Each event has an id, so a repeated event is recognised and ignored. No double update, no double email.' },
    ],
    cases: [
      'Test card approved: the order becomes paid',
      'Test card declined: a clear message, the order stays pending',
      'Extra verification (3D Secure) card: the flow waits and continues',
      'The same webhook arrives twice: the order is updated once',
    ],
  },

  // ───────────────────────────── Automation ─────────────────────────────
  {
    id: 'automation',
    title: 'Automation',
    icon: Workflow,
    proves: 'Background workflows that retry, fail safely and can be replayed.',
    summary:
      'Automations run without anyone watching, so they must be patient and honest: retry when something is down, report when it is truly broken, and keep a record of every run.',
    techniques: ['Job queue', 'Concurrency limit', 'Retry with backoff', 'Failed-jobs queue', 'Run log'],
    nodes: [
      { id: 'trigger', label: 'Trigger', icon: Webhook, x: 8, y: 50, note: 'A webhook, a schedule or an event starts the automation.' },
      { id: 'queue', label: 'Job queue', icon: Inbox, x: 28, y: 50, note: 'Every trigger becomes a job in a queue, and the sender gets an instant answer.' },
      { id: 'workers', label: 'Workers', icon: Cpu, x: 49, y: 50, note: 'Pick up jobs at a controlled speed (a concurrency limit protects other systems).' },
      { id: 'retry', label: 'Retry with backoff', icon: RefreshCw, x: 70, y: 20, note: 'A failed job is tried again after 1, 2, 4, 8 minutes and so on.' },
      { id: 'dlq', label: 'Failed jobs', icon: Layers, x: 91, y: 20, note: 'Jobs that still fail after N tries are parked here for a human.' },
      { id: 'log', label: 'Run log', icon: Database, x: 70, y: 80, note: 'Every run, with its input and result, so it can be inspected and replayed.' },
      { id: 'alert', label: 'Alert', icon: Bell, x: 91, y: 80, note: 'A message to Slack or Discord when something needs attention.' },
    ],
    edges: [['trigger', 'queue'], ['queue', 'workers'], ['workers', 'retry'], ['retry', 'dlq'], ['workers', 'log'], ['dlq', 'alert'], ['log', 'alert']],
    steps: [
      { title: 'The trigger is accepted instantly', nodes: ['trigger', 'queue'], text: 'The event is stored as a job and the sender gets "received" at once. Slow work never makes the sender wait or time out.' },
      { title: 'Workers keep a steady pace', nodes: ['queue', 'workers'], text: 'Workers take jobs at a limited speed. A burst of 10,000 triggers becomes a long queue, not a crash, and other systems are never flooded.' },
      { title: 'Failures are retried, patiently', nodes: ['workers', 'retry'], text: 'If a service is down, the job waits and tries again with growing delays. Most problems fix themselves without anyone noticing.' },
      { title: 'Real failures are parked and reported', nodes: ['retry', 'dlq', 'alert'], text: 'After N failed tries the job moves to the failed-jobs queue and an alert is sent. Nothing is lost and nothing fails silently.' },
      { title: 'Every run is recorded', nodes: ['workers', 'log', 'alert'], text: 'Each run keeps its input, result and time. A fixed job can be replayed with one click.' },
    ],
    cases: [
      '10,000 triggers at once: the queue grows, nothing crashes',
      'A service is down for 10 minutes: jobs retry and then succeed',
      'A job fails 5 times: it is parked and an alert is sent',
      'Replay a failed job after the fix: it completes',
    ],
  },
];
