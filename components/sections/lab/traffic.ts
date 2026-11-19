import {
  BellRing, Boxes, CreditCard, Database, Gauge, Globe, Inbox, ListOrdered, Monitor, RefreshCw, Server, ServerCrash, ShieldCheck, Timer,
  type LucideIcon,
} from 'lucide-react';

/**
 * ── Highest traffic product ─────────────────────────────────────────────────
 * The journey of ONE click, from the React button to the confirmed order.
 * This is a reference design (how I would build it). Read the text and edit it so it says
 * exactly what you want to claim. All numbers are examples.
 *
 * Rules of the design:
 *  - Nobody is thrown out because of traffic: people wait in a line, they get no error page.
 *  - Everyone can enter the buying screen, even if there is not enough stock for all.
 *  - The first requests (in line order) get the item. The rest see "sold out for now".
 */

export const STOCK = 100;          // items for sale
export const RUSH_VISITORS = 100_000;
export const NORMAL_VISITORS = 200;
export const LINE_SIZE = 28_000;   // people who reach the waiting room in the rush
export const ADMIT_PER_SECOND = 2_000;
export const FAST_PLACE = 37;      // "you are fast": you are the 37th in line, so you win
export const SLOW_PLACE = 8_412;   // "you are slow": 8,412th in line, the 100 items are gone

/** What the user sees at one moment. */
export type UserState =
  | 'product' | 'joining' | 'line' | 'turn' | 'checking'
  | 'reserved' | 'soldout' | 'paying' | 'saving' | 'done' | 'notyours'
  // calm messages shown while something goes wrong in the background
  | 'slow' | 'kept' | 'slowline' | 'pending' | 'finishing'
  // the winner did not pay: what the winner sees, and what a person who lost the race sees
  | 'timeup' | 'released' | 'restock';

export type TrafficStep = {
  id: string;
  title: string;
  icon: LucideIcon;
  node: string;              // the part of the system
  tools: string;             // tools and libraries
  role: string;              // its job in one line
  conditions: string[];      // "if … → …" decisions
  explain: string;           // plain-language explanation
  user: UserState | { win: UserState; lose: UserState };
  funnel: number;            // which bar of the funnel this step is about
  passed: string;            // short recap shown on the user's screen once the step is over
  kind?: 'problem' | 'recovery';   // only for the steps added by a "what goes wrong" scenario
};

export const STEPS: TrafficStep[] = [
  {
    id: 'click', title: 'Button clicked', icon: Monitor,
    node: 'App', tools: 'React · React Query · crypto.randomUUID()', role: 'Locks the button and makes the idempotency key',
    conditions: ['Clicked again? → ignored, the button is locked', 'No answer in time? → try again later (growing delay + a random delay)'],
    explain: 'The browser locks the Buy button, so one person cannot click five times. It also creates an idempotency key: a unique id for this one click, so the server can recognise a repeat. The API client has a timeout and retries politely if the network is slow.',
    user: 'joining', funnel: 0,
    passed: 'request sent',
  },
  {
    id: 'cloudflare', title: 'Cloudflare', icon: Globe,
    node: 'Cloudflare', tools: 'CDN cache · WAF · Turnstile (bot check)', role: 'Answers from cache, blocks bots',
    conditions: ['The answer is in the cache? → reply from the edge, the server never sees it', 'A bot or an attacker? → block it, or give a challenge'],
    explain: 'Most of the 100,000 clicks never reach your servers. Cloudflare answers cacheable requests (the product page, "how many left") itself and blocks fake traffic and attacks. This is the cheapest place to remove load.',
    user: 'joining', funnel: 1,
    passed: 'not a bot, not cached',
  },
  {
    id: 'alb', title: 'Load balancer', icon: Server,
    node: 'Load balancer (ALB)', tools: 'AWS ALB · Nginx · Kubernetes autoscaling', role: 'Sends each request to a healthy server',
    conditions: ['A server is unhealthy? → taken out of the pool', 'Traffic is growing? → more servers are started automatically'],
    explain: 'The load balancer spreads requests over many identical API servers and checks their health all the time. When traffic grows, new servers are added. Because the servers keep no state, any of them can answer any request.',
    user: 'joining', funnel: 1,
    passed: 'sent to a healthy server',
  },
  {
    id: 'rate', title: 'Rate limit', icon: Gauge,
    node: 'Rate limit', tools: 'Redis token bucket · slowapi', role: 'Gives each visitor a request budget',
    conditions: ['A bot or abuse over the budget? → blocked (429)', 'A real person over the budget? → held in the line, no error shown'],
    explain: 'Every visitor has a small budget of requests per second, counted in Redis. Abuse and bots are refused. A real person is never shown an error: they are held calmly and the browser retries in the background with a random delay.',
    user: 'joining', funnel: 2,
    passed: 'within the budget',
  },
  {
    id: 'room', title: 'Waiting room', icon: ListOrdered,
    node: 'Waiting room', tools: 'Redis sorted set · Server-Sent Events · heartbeat', role: 'Gives your place in line, lets people in at a safe speed',
    conditions: [
      'The system has room? → straight in, no waiting',
      'Busy? → you get a sequence number (your place) and wait; people are let in at a safe speed, for example 2,000 per second',
      'You closed the tab? → your place is released after about 2 minutes',
      'The core is slow? → fewer people are let in (for example 1,000 → 500 per second), nobody is thrown out',
    ],
    explain: 'The waiting room is a gate, not a one-at-a-time line. It does not wait for other people to finish buying. It only controls how fast people go in, so the core always sees a steady flow. Your place (sequence number) is what makes "fast" fair. The page updates by itself, so nobody has to refresh or leave.',
    user: 'line', funnel: 3,
    passed: 'let in',
  },
  {
    id: 'middleware', title: 'Core middleware', icon: ShieldCheck,
    node: 'Core middleware', tools: 'FastAPI · JWT · Pydantic · Redis', role: 'Security and checks before the core',
    conditions: ['Login token invalid? → 401', 'Input invalid? → 422 straight away', 'The same idempotency key again? → return the same answer, no second order'],
    explain: 'Only people the line let in reach this step. It checks the login token, validates the input, adds security headers, and looks up the idempotency key so a repeated click cannot create a second order. Timeouts and a circuit breaker protect the core when something behind it is slow.',
    user: 'turn', funnel: 4,
    passed: 'security checks passed',
  },
  {
    id: 'stock', title: 'Stock claim', icon: Boxes,
    node: 'Stock claim', tools: 'Redis atomic counter (Lua script)', role: 'Decides who gets the item, in line order',
    conditions: ['Stock above 0? → take 1, you win', 'Stock is 0? → you lose: "sold out for now"', 'One request at a time, so nobody gets the same item twice'],
    explain: 'This is where "fast" is decided. In one atomic step in memory (not in the database) the counter checks the stock and takes one item. Requests are handled in the order of their place in line. With 100 items, the first 100 win and everybody else gets an answer immediately.',
    user: 'checking', funnel: 5,
    passed: 'stock answered',
  },
  {
    id: 'answer', title: 'First answer', icon: Timer,
    node: 'Reservation and notify list', tools: 'Redis key with a timer · CDN flag · notify-me list', role: 'Winners get 5 minutes to pay',
    conditions: [
      'Winner? → the item is reserved for 5 minutes',
      'Loser? → "sold out for now" is cached, and "notify me" is saved',
      'A reservation is not paid in 5 minutes? → the item goes back to stock and notifications go out in waves',
    ],
    explain: 'The user gets the first answer very fast. A winner has a reservation with a 5-minute timer, so no one else can take that item meanwhile. A loser is not thrown out: they see "sold out for now" with the next stock date and can turn on a notification. When stock returns, people are told in waves, so 50,000 people do not rush back at once.',
    user: { win: 'reserved', lose: 'soldout' }, funnel: 5,
    passed: 'item reserved',
  },
  {
    id: 'payment', title: 'Payment queue', icon: Inbox,
    node: 'Payment queue and workers', tools: 'Redis Streams / RabbitMQ · Celery or Arq · Stripe', role: 'Payments at a steady speed',
    conditions: [
      'Workers take jobs at a controlled speed',
      'The queue gets long? → more workers start automatically, up to a maximum the database and the payment provider can take',
      'The provider is slow? → the order stays PENDING and is asked again with the same key (charged once)',
      'Fails many times? → failed-jobs queue + an alert',
    ],
    explain: 'The slow work leaves the request path. The order goes into a queue and workers process it at a speed the payment provider and database can handle. A repeated payment request is safe because of the idempotency key.',
    user: { win: 'paying', lose: 'notyours' }, funnel: 6,
    passed: 'payment done',
  },
  {
    id: 'db', title: 'Database write', icon: Database,
    node: 'Database', tools: 'PostgreSQL · PgBouncer · read replicas', role: 'Saves the order, never sees the spike',
    conditions: ['Writes arrive at a steady speed, never as a spike', 'The same order twice? → a unique key stops it', 'The database is slow? → a timeout and a safe retry'],
    explain: 'Only now does the database get involved. It receives a small, steady stream of writes from the workers, through a connection pool. A unique key on the order is the last safety net against duplicates. Reads for the product page come from replicas and caches.',
    user: { win: 'saving', lose: 'notyours' }, funnel: 7,
    passed: 'order saved',
  },
  {
    id: 'done', title: 'Order confirmed', icon: BellRing,
    node: 'Result and monitoring', tools: 'Server-Sent Events · email queue · Prometheus · Grafana', role: 'Tells the user, watches everything',
    conditions: ['The result is pushed to the page', 'The receipt is sent once (event id)', 'Metrics and alerts watch every step of the chain'],
    explain: 'The second answer goes back to the user: "order confirmed", pushed to the page without refreshing. The receipt is sent once. All the time, metrics and alerts watch the queue length, the waiting time, the error rate and the database, and load tests (k6 or Locust) check this chain before the real day.',
    user: { win: 'done', lose: 'notyours' }, funnel: 7,
    passed: 'confirmed',
  },
];

/** How many people are still in the game after each layer. */
export const FUNNEL: { label: string; note: string; rush: number; normal: number }[] = [
  { label: 'Clicks', note: 'everyone presses Buy', rush: 100_000, normal: 200 },
  { label: 'Passed Cloudflare', note: 'cache answers most, bots are blocked', rush: 30_000, normal: 60 },
  { label: 'Passed rate limit', note: 'abuse is blocked', rush: 28_000, normal: 60 },
  { label: 'In the line', note: 'held, not rejected', rush: 28_000, normal: 60 },
  { label: 'Passed security', note: 'invalid or repeated', rush: 27_800, normal: 60 },
  { label: 'Got the item', note: `${STOCK} in stock`, rush: STOCK, normal: 60 },
  { label: 'Paid', note: 'steady, from the queue', rush: STOCK, normal: 60 },
  { label: 'Saved in database', note: 'steady writes', rush: STOCK, normal: 60 },
];


// ───────────────────────────── what goes wrong ─────────────────────────────
// The default is a healthy day. Each problem adds a few steps (the problem, then the recovery).
export type ScenarioId = 'healthy' | 'timeout' | 'crash' | 'redis' | 'slowcore' | 'payment' | 'db' | 'nopay';

export const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: 'healthy', label: 'Healthy' },
  { id: 'timeout', label: 'Request times out' },
  { id: 'crash', label: 'A server crashes' },
  { id: 'redis', label: 'Redis fails' },
  { id: 'slowcore', label: 'Core is slow' },
  { id: 'payment', label: 'Payment times out' },
  { id: 'db', label: 'Database is down' },
  { id: 'nopay', label: 'Winner never pays' },
];

type Extra = { after: string; steps: TrafficStep[]; endsHere?: boolean };

const EXTRA: Record<Exclude<ScenarioId, 'healthy'>, Extra> = {
  // ── the app does not get an answer ──
  timeout: {
    after: 'click',
    steps: [
      {
        id: 'timeout-1', kind: 'problem', title: 'No answer in time', icon: Timer,
        node: 'App', tools: 'fetch timeout · AbortController', role: 'Gives up waiting after 10 seconds',
        conditions: ['No answer after 10 seconds? → stop waiting, but do not show an error', 'The idempotency key is kept for the next try'],
        explain: 'The network is slow or the server is busy, so no answer comes back. The app does not wait forever, and it does not show an error page either. The user only sees a calm message: "Still working on it". The idempotency key is kept, so the next try is safe.',
        user: 'slow', funnel: 0, passed: 'waited, then retried',
      },
      {
        id: 'timeout-2', kind: 'recovery', title: 'Tries again', icon: RefreshCw,
        node: 'App', tools: 'React Query retry · backoff · jitter', role: 'Retries with a growing, random delay',
        conditions: [
          'Waits 1s, 2s, 4s… plus a random delay, so thousands of apps do not retry at the same moment',
          'The server says "wait" (Retry-After)? → waits that long',
          'Still nothing after several tries? → shows "Check my order", which asks the server by key',
        ],
        explain: 'The app tries again with the same key. If the first request had actually arrived, the server recognises the key and returns the same answer, so nothing happens twice. The retry delays grow and are random, so a crowd of apps never retries all together.',
        user: 'joining', funnel: 0, passed: 'retry worked',
      },
    ],
  },

  // ── one API server dies ──
  crash: {
    after: 'alb',
    steps: [
      {
        id: 'crash-1', kind: 'problem', title: 'A server crashes', icon: ServerCrash,
        node: 'API server', tools: 'AWS ALB health check · Kubernetes', role: 'One server dies while it is working',
        conditions: ['The health check fails twice? → the load balancer takes the server out of the pool', 'The requests that were inside it get no answer'],
        explain: 'Out of many identical API servers, one crashes in the middle of its work. The load balancer notices because its regular health check fails, and it stops sending traffic there. The requests that were inside that server never get an answer.',
        user: 'joining', funnel: 1, passed: 'handled',
      },
      {
        id: 'crash-2', kind: 'recovery', title: 'Replaced and retried', icon: RefreshCw,
        node: 'Load balancer + autoscaling', tools: 'AWS ALB · Auto Scaling · Kubernetes', role: 'Starts a new server, the app retries',
        conditions: ['A new server is started automatically', 'The app retries and another healthy server answers', 'The servers keep no state of their own, so nothing is lost'],
        explain: 'Autoscaling starts a replacement. Meanwhile the app retries (with the same key), and another healthy server answers. The user only waited a little longer. Because the servers keep no state, any of them can take over any request.',
        user: 'joining', funnel: 1, passed: 'retried on another server',
      },
    ],
  },

  // ── Redis (the line and the stock counter) fails ──
  redis: {
    after: 'middleware',
    steps: [
      {
        id: 'redis-1', kind: 'problem', title: 'Redis goes down', icon: ServerCrash,
        node: 'Redis (line + counter)', tools: 'Redis primary · replica · Sentinel', role: 'The memory store of the line and the stock counter fails',
        conditions: [
          'The stock claim pauses: we never sell without the counter (fail closed)',
          'People stay in the line, their place is kept',
          'The rate limit falls back to a small local limit (fail open)',
        ],
        explain: 'Redis holds the line, the rate limit and the stock counter, so this is a serious failure. The rule: when money or stock is involved, do not guess. The stock claim waits, because selling without the counter could sell the same item twice. The people simply stay in the line with a calm message, and their place is kept.',
        user: 'kept', funnel: 5, passed: 'handled',
      },
      {
        id: 'redis-2', kind: 'recovery', title: 'Standby takes over', icon: RefreshCw,
        node: 'Redis standby copy', tools: 'Redis replica · automatic failover', role: 'A copy becomes the main one within seconds',
        conditions: ['The standby copy is promoted automatically', 'The stock claim continues, in the same line order', 'A reconcile job checks the counter against the real orders'],
        explain: 'A standby copy of Redis, kept up to date all the time, is promoted to the main one within seconds. The stock claim continues in the same line order. Later, a reconcile job compares the counter with the real orders, in case a few changes were lost in the switch.',
        user: 'checking', funnel: 5, passed: 'claim continued',
      },
    ],
  },

  // ── the core is slow: the waiting room lets fewer people in ──
  slowcore: {
    after: 'room',
    steps: [
      {
        id: 'slow-1', kind: 'problem', title: 'The core gets slow', icon: Gauge,
        node: 'Core (API + queries)', tools: 'Prometheus latency · circuit breaker', role: 'Responses slow down under the load',
        conditions: [
          'Response time above 1 second? → let in fewer people',
          'The speed drops from 1,000 to 500 per second (and lower if it gets worse)',
          'Nobody is thrown out: the line just moves slower',
        ],
        explain: 'The core is struggling, for example response times went from 200 ms to 2 seconds. The waiting room notices from the numbers and automatically lets in fewer people: 500 per second instead of 1,000. The people who are not let in stay in the line and wait a little longer. This protects the core, so it can recover.',
        user: 'slowline', funnel: 3, passed: 'waited a bit longer',
      },
      {
        id: 'slow-2', kind: 'recovery', title: 'Speed recovers slowly', icon: ListOrdered,
        node: 'Waiting room', tools: 'Redis counter · small controller', role: 'Raises the speed in small steps',
        conditions: [
          'The core is healthy again? → raise the speed in small steps (for example +50 every few seconds)',
          'Trouble returns? → cut quickly again',
          'It keeps failing? → a circuit breaker closes the gate for a moment, then tries a few people',
        ],
        explain: 'When the core is healthy again, the speed is not jumped straight back to 1,000, because that could overload it again. It goes up in small steps, and it drops fast when trouble returns: "cut quickly, raise slowly".',
        user: 'line', funnel: 3, passed: 'speed restored',
      },
    ],
  },

  // ── the payment provider does not answer ──
  payment: {
    after: 'payment',
    steps: [
      {
        id: 'pay-1', kind: 'problem', title: 'No answer from the provider', icon: CreditCard,
        node: 'Payment provider', tools: 'Stripe · timeout · idempotency key', role: 'Does not answer in time',
        conditions: [
          'No answer after 5 seconds? → we do NOT know if the card was charged',
          'The order stays PENDING and is never guessed to be "failed"',
          'The reservation timer is paused',
        ],
        explain: 'A timeout does not mean "failed". It means "we do not know", and the card may already have been charged. So the order stays PENDING, and the reservation timer is paused so the winner does not lose the item. The user sees a calm message.',
        user: 'pending', funnel: 6, passed: 'handled',
      },
      {
        id: 'pay-2', kind: 'recovery', title: 'Asked again, charged once', icon: RefreshCw,
        node: 'Payment worker', tools: 'Celery or Arq · retry · Stripe webhook', role: 'Asks again with the same payment key',
        conditions: [
          'The worker asks again with the SAME payment key',
          'The provider answers with the result of the first try: charged once',
          'A webhook can confirm it later too; repeated events are ignored (event id)',
          'The provider is down for long? → the payments wait in the queue and the user gets an email',
        ],
        explain: 'The worker is responsible for this. It asks the provider again with the same payment key, and the provider answers with the result of the first try instead of charging again. If the provider stays down, the payments wait safely in the queue, and the user is told by email.',
        user: 'paying', funnel: 6, passed: 'charged once',
      },
    ],
  },

  // ── the database is down ──
  db: {
    after: 'payment',
    steps: [
      {
        id: 'db-1', kind: 'problem', title: 'Database is down', icon: Database,
        node: 'Database', tools: 'PostgreSQL · PgBouncer · queue', role: 'Writes fail, nothing can be saved',
        conditions: [
          'Writes time out? → the workers stop and retry with growing delays',
          'The orders wait in the queue, so nothing is lost',
          'The user already has a reservation and sees "finishing your order"',
        ],
        explain: 'The database cannot take writes. The workers do not lose anything: the orders stay in the queue. The user already has a reservation, so the screen calmly says "finishing your order". The queue is what protects the orders.',
        user: 'finishing', funnel: 7, passed: 'handled',
      },
      {
        id: 'db-2', kind: 'recovery', title: 'Standby takes over', icon: Inbox,
        node: 'Standby database + workers', tools: 'PostgreSQL standby · failover · Celery or Arq', role: 'A standby takes over, the queue empties',
        conditions: [
          'The standby database becomes the main one (usually within a minute or two)',
          'The workers continue and save the waiting orders, in order',
          'The unique order key stops any duplicate',
        ],
        explain: 'A standby database, kept up to date, becomes the main one, usually within a minute or two. The workers continue and save the orders that waited in the queue, in order. The unique key on each order is the last protection against duplicates.',
        user: 'saving', funnel: 7, passed: 'queue emptied',
      },
    ],
  },

  // ── the winner never pays: the item comes back ──
  nopay: {
    after: 'answer',
    endsHere: true,
    steps: [
      {
        id: 'nopay-1', kind: 'problem', title: 'The winner does not pay', icon: Timer,
        node: 'Reservation timer', tools: 'Redis key with a timer', role: '5 minutes pass without a payment',
        conditions: ['The reservation ends after 5 minutes', 'No order is ever created'],
        explain: 'A winner has the item reserved for 5 minutes. Some winners never pay: they close the page, their card fails, or they get distracted. When the 5 minutes end, the reservation simply disappears.',
        user: { win: 'timeup', lose: 'soldout' }, funnel: 5, passed: 'time ran out',
      },
      {
        id: 'nopay-2', kind: 'recovery', title: 'The item returns', icon: Boxes,
        node: 'Stock counter + notify list', tools: 'Redis counter · email queue · notify-me list', role: 'Gives the item back and tells people',
        conditions: [
          'The counter goes up by 1: the item can be claimed again',
          '"Notify me" people are told in waves, so thousands do not rush back at once',
          'Someone claims it through the same fair stock claim',
        ],
        explain: 'The item goes back into the stock. The people who pressed "Notify me" are told, in waves, and the item is claimed again through the same fair stock claim. Without this, items would stay stuck with people who never pay.',
        user: { win: 'released', lose: 'restock' }, funnel: 5, passed: 'back in stock',
      },
    ],
  },
};

/** The steps of the journey for a scenario: the healthy steps, plus the problem and its recovery. */
export function buildSteps(id: ScenarioId): TrafficStep[] {
  if (id === 'healthy') return STEPS;
  const { after, steps, endsHere } = EXTRA[id];
  const at = STEPS.findIndex(s => s.id === after);
  return [...STEPS.slice(0, at + 1), ...steps, ...(endsHere ? [] : STEPS.slice(at + 1))];
}
