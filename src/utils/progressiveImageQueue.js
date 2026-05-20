/**
 * Global priority queue for progressive image upgrades (limits concurrent loads).
 */

const queue = [];
let active = 0;
const MAX_CONCURRENT = 3;

function drain() {
  if (active >= MAX_CONCURRENT || queue.length === 0) return;
  queue.sort((a, b) => a.priority - b.priority);
  const job = queue.shift();
  if (!job) return;
  active += 1;
  Promise.resolve()
    .then(() => job.run())
    .finally(() => {
      active -= 1;
      drain();
    });
}

/**
 * @param {() => void | Promise<void>} run
 * @param {number} priority 1 = highest (above fold), 4 = lowest
 */
export function scheduleImageUpgrade(run, priority = 2) {
  queue.push({ run, priority });
  drain();
}

export function clearImageUpgradeQueue() {
  queue.length = 0;
}
