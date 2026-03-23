const KEY      = 'cafeai_usage';
const MAX      = 20;
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

interface Usage {
  count:     number;
  weekStart: number;
}

function getUsage(): Usage {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { count: 0, weekStart: Date.now() };

    const usage: Usage = JSON.parse(raw);

    // Reset if a week has passed
    if (Date.now() - usage.weekStart > ONE_WEEK) {
      return { count: 0, weekStart: Date.now() };
    }

    return usage;
  } catch {
    return { count: 0, weekStart: Date.now() };
  }
}

export function canBrew(): boolean {
  const usage = getUsage();
  return usage.count < MAX;
}

export function incrementUsage(): void {
  const usage = getUsage();
  localStorage.setItem(KEY, JSON.stringify({
    count:     usage.count + 1,
    weekStart: usage.weekStart,
  }));
}

export function getRemainingBrews(): number {
  const usage = getUsage();
  return Math.max(0, MAX - usage.count);
}

export function getResetDate(): Date {
  const usage = getUsage();
  return new Date(usage.weekStart + ONE_WEEK);
}