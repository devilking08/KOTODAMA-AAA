/**
 * Research collector helper.
 *
 * Usage: `npm run research`
 *
 * - Validates optional GitHub API credentials (env only, never printed).
 * - Prints a seed list of sources used for the competitive analysis.
 * - Does NOT ship browsing results into the repo; docs/ are authored.
 */
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

async function checkGitHub() {
  if (!token) {
    console.log('  (no GITHUB_TOKEN/GH_TOKEN set — public rate limits apply)');
    return;
  }
  const res = await fetch('https://api.github.com/rate_limit', {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'kotodama-research' },
  });
  const body = await res.json();
  const core = body?.resources?.core;
  console.log(`  GitHub API: ${res.status} — remaining ${core?.remaining}/${core?.limit}`);
}

const SEED = [
  'Sekiro: Shadows Die Twice — posture/parry/deathblow encounter design',
  'Ghost of Tsushima — stances, open-zone chapter, cinematic framing',
  'Nioh 2 — Ki/pulse economy, stance depth',
  'Wo Long: Fallen Dynasty — deflects, morale, wuxia pacing',
  'Elden Ring — checkpoint economics, exploration payoff cadence',
  'Devil May Cry 5 — hitstop, camera, style feedback',
  'Nier: Automata — thematic multiple endings',
  'Stellar Blade — parry feedback, boss staging',
];

checkGitHub().then(() => {
  console.log('\nSeed sources for the competitive analysis (docs/RESEARCH.md):');
  for (const s of SEED) console.log(`  - ${s}`);
  console.log('\nNext step: collect notes per source, then update docs/RESEARCH.md');
});
