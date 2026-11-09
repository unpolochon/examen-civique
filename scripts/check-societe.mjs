// Self-check for the "societe" theme content. Run: node scripts/check-societe.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };

const THEME = 'societe';
const EM_DASH = '\u2014';
const questions = JSON.parse(read(`content/questions/${THEME}.json`));
const official = JSON.parse(read('data/official/cr-questions.json')).questions.filter((q) => q.theme === THEME);
const notions = new Set([...read('docs/referentiel.md').matchAll(/`(societe\.[a-z-]+)`/g)].map((m) => m[1]));
check(notions.size > 0, 'no societe.* notion found in docs/referentiel.md');
check(official.length > 0, 'no official question found for the theme');

// Official ids: each present exactly once, text unchanged.
const byId = new Map();
for (const q of questions) {
  check(!byId.has(q.id), `${q.id}: duplicate id`);
  byId.set(q.id, q);
}
for (const o of official) {
  const q = byId.get(o.id);
  check(q, `${o.id}: official question missing`);
  if (q) check(q.question === o.question, `${o.id}: question text differs from the official text`);
}
const officialIds = new Set(official.map((o) => o.id));

// Per-question checks.
for (const q of questions) {
  const id = q.id ?? '(no id)';
  check(q.theme === THEME, `${id}: theme must be "${THEME}"`);
  check(notions.has(q.notion), `${id}: unknown notion "${q.notion}"`);
  check(Array.isArray(q.choices) && q.choices.length === 4, `${id}: needs exactly 4 choices`);
  const choices = (q.choices ?? []).map((c) => (typeof c === 'string' ? c.trim() : ''));
  check(choices.every(Boolean), `${id}: empty choice`);
  check(new Set(choices.map((c) => c.toLowerCase())).size === choices.length, `${id}: duplicate choices`);
  check(q.answer === 0, `${id}: answer must be 0`);
  check(typeof q.explanation === 'string' && q.explanation.trim(), `${id}: missing explanation`);
  check(/^https:\/\/formation-civique\.interieur\.gouv\.fr\/fiches-par-thematiques\//.test(q.source ?? ''), `${id}: source must be an official fiche URL`);
  check(typeof q.lesson === 'string' && q.lesson.startsWith(`${THEME}/`) && existsSync(join(root, 'content/lessons', `${q.lesson}.md`)), `${id}: lesson file not found for "${q.lesson}"`);
  check(q.review === undefined || (typeof q.review === 'string' && q.review.trim()), `${id}: review must be a non-empty string`);
  if (q.id?.startsWith('CR-')) {
    check(officialIds.has(q.id), `${id}: not an official id of the theme`);
    check(q.type === 'connaissance' && q.official === true, `${id}: official question needs type "connaissance" and official true`);
    check(q.notion !== `${THEME}.situations`, `${id}: official question cannot use a situations notion`);
  } else {
    check(/^SIT-SOC-\d{3}$/.test(q.id ?? ''), `${id}: situation id must look like SIT-SOC-001`);
    check(q.type === 'situation' && q.official === false && q.notion === `${THEME}.situations`, `${id}: situation needs type "situation", official false, notion ${THEME}.situations`);
  }
}

// Lessons: front matter and final "À retenir" section with 3 to 5 bullets.
const lessonDir = `content/lessons/${THEME}`;
const lessonFiles = readdirSync(join(root, lessonDir)).filter((f) => f.endsWith('.md'));
const orders = [];
for (const f of lessonFiles) {
  const text = read(`${lessonDir}/${f}`);
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '';
  const field = (k) => fm.match(new RegExp(`^${k}: (.+)$`, 'm'))?.[1];
  check(field('id') === `${THEME}/${f.slice(0, -3)}`, `${f}: front matter id must match the file name`);
  check(field('theme') === THEME, `${f}: front matter theme must be "${THEME}"`);
  check(notions.has(field('notion')), `${f}: unknown notion`);
  check(field('title')?.trim(), `${f}: missing title`);
  const minutes = Number(field('minutes'));
  check(Number.isInteger(minutes) && minutes >= 4 && minutes <= 8, `${f}: minutes must be an integer from 4 to 8`);
  const order = Number(field('order'));
  check(Number.isInteger(order), `${f}: order must be an integer`);
  orders.push(order);
  check(/^sources:\n(  - https:\/\/\S+\n)+/m.test(fm + '\n'), `${f}: needs a sources list`);
  const tail = text.split('\n## À retenir\n')[1];
  check(tail !== undefined && !tail.includes('\n## '), `${f}: must end with a "## À retenir" section`);
  const bullets = (tail ?? '').split('\n').filter((l) => l.startsWith('- ')).length;
  check(bullets >= 3 && bullets <= 5, `${f}: "À retenir" needs 3 to 5 bullets (found ${bullets})`);
}
check(new Set(orders).size === orders.length, 'lesson order values must be unique');
for (const n of notions) {
  if (n === `${THEME}.situations`) continue;
  const count = lessonFiles.filter((f) => read(`${lessonDir}/${f}`).includes(`\nnotion: ${n}\n`)).length;
  check(count >= 1 && count <= 3, `notion ${n} needs 1 to 3 lessons (found ${count})`);
}

// No em dash in any file of this deliverable.
const files = [`content/questions/${THEME}.json`, `docs/content-review/${THEME}.md`, 'scripts/check-societe.mjs', ...lessonFiles.map((f) => `${lessonDir}/${f}`)];
for (const p of files) {
  check(existsSync(join(root, p)), `${p}: file missing`);
  if (existsSync(join(root, p))) check(!read(p).includes(EM_DASH), `${p}: contains an em dash (U+2014)`);
}

if (errors.length) {
  console.error(`check-societe: ${errors.length} error(s)\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
const count = (n) => questions.filter((q) => q.notion === n).length;
console.log(`check-societe: OK. ${official.length}/${official.length} official questions, ${questions.filter((q) => q.type === 'situation').length} situations, ${lessonFiles.length} lessons.`);
console.log(`  by notion: ${[...notions].map((n) => `${n}=${count(n)}`).join(', ')}; review flags: ${questions.filter((q) => q.review).length}`);
