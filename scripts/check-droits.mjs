// Self-check for the "droits" theme content. Run: node scripts/check-droits.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };

const THEME = 'droits';
const EM_DASH = '\u2014';
const questions = JSON.parse(read(`content/questions/${THEME}.json`));
const official = JSON.parse(read('data/official/cr-questions.json')).questions.filter((q) => q.theme === THEME);
const notions = new Set([...read('docs/referentiel.md').matchAll(/`(droits\.[a-z-]+)`/g)].map((m) => m[1]));
check(notions.size > 0, 'no droits.* notion found in docs/referentiel.md');

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
  check(typeof q.lesson === 'string' && existsSync(join(root, 'content/lessons', `${q.lesson}.md`)), `${id}: lesson file not found for "${q.lesson}"`);
  if (q.id?.startsWith('CR-')) {
    check(officialIds.has(q.id), `${id}: not an official id of the theme`);
    check(q.type === 'connaissance' && q.official === true, `${id}: official question needs type "connaissance" and official true`);
  } else {
    check(/^SIT-DRO-\d{3}$/.test(q.id ?? ''), `${id}: situation id must look like SIT-DRO-001`);
    check(q.type === 'situation' && q.official === false && q.notion === 'droits.situations', `${id}: situation needs type "situation", official false, notion droits.situations`);
  }
}
check(questions.filter((q) => q.type === 'situation').length === 30, 'expected 30 situations');

// Lessons: front matter and final "À retenir" section with 3 to 5 bullets.
const lessonDir = `content/lessons/${THEME}`;
const lessonFiles = readdirSync(join(root, lessonDir)).filter((f) => f.endsWith('.md'));
for (const f of lessonFiles) {
  const text = read(`${lessonDir}/${f}`);
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '';
  const field = (k) => fm.match(new RegExp(`^${k}: (.+)$`, 'm'))?.[1];
  check(field('id') === `${THEME}/${f.slice(0, -3)}`, `${f}: front matter id must match the file name`);
  check(field('theme') === THEME, `${f}: front matter theme must be "${THEME}"`);
  check(notions.has(field('notion')), `${f}: unknown notion`);
  const minutes = Number(field('minutes'));
  check(Number.isInteger(minutes) && minutes >= 4 && minutes <= 8, `${f}: minutes must be an integer from 4 to 8`);
  check(Number.isInteger(Number(field('order'))), `${f}: order must be an integer`);
  check(/^sources:\n(  - https:\/\/\S+\n)+/m.test(fm + '\n'), `${f}: needs a sources list`);
  const tail = text.split('\n## À retenir\n')[1];
  check(tail !== undefined && !tail.includes('\n## '), `${f}: must end with a "## À retenir" section`);
  const bullets = (tail ?? '').split('\n').filter((l) => l.startsWith('- ')).length;
  check(bullets >= 3 && bullets <= 5, `${f}: "À retenir" needs 3 to 5 bullets (found ${bullets})`);
}
for (const n of notions) check(lessonFiles.some((f) => read(`${lessonDir}/${f}`).includes(`\nnotion: ${n}\n`)), `no lesson for notion ${n}`);

// No em dash in any file of this deliverable.
const files = [`content/questions/${THEME}.json`, `docs/content-review/${THEME}.md`, 'scripts/check-droits.mjs', ...lessonFiles.map((f) => `${lessonDir}/${f}`)];
for (const p of files) {
  check(existsSync(join(root, p)), `${p}: file missing`);
  if (existsSync(join(root, p))) check(!read(p).includes(EM_DASH), `${p}: contains an em dash (U+2014)`);
}

if (errors.length) {
  console.error(`check-droits: ${errors.length} error(s)\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
const count = (n) => questions.filter((q) => q.notion === n).length;
console.log(`check-droits: OK. ${official.length}/${official.length} official questions, ${count('droits.situations')} situations, ${lessonFiles.length} lessons.`);
console.log(`  by notion: ${[...notions].map((n) => `${n}=${count(n)}`).join(', ')}; review flags: ${questions.filter((q) => q.review).length}`);
