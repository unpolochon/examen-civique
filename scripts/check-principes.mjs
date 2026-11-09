// Self-check for the "principes" theme content. Run: node scripts/check-principes.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const THEME = 'principes';
const NOTIONS = ['principes.devise-symboles', 'principes.laicite', 'principes.situations'];
const SITUATIONS = 30;
const errors = [];
const fail = (msg) => errors.push(msg);

const items = JSON.parse(read(`content/questions/${THEME}.json`));
const official = JSON.parse(read('data/official/cr-questions.json')).questions.filter((q) => q.theme === THEME);
const officialById = new Map(official.map((q) => [q.id, q]));

// Every official id of the theme appears exactly once, with its exact text.
const count = new Map();
for (const it of items) count.set(it.id, (count.get(it.id) || 0) + 1);
for (const [id, n] of count) if (n > 1) fail(`${id}: present ${n} times`);
for (const q of official) if (!count.has(q.id)) fail(`${q.id}: official question missing`);

for (const it of items) {
  const where = it.id || '(no id)';
  if (it.theme !== THEME) fail(`${where}: theme is "${it.theme}"`);
  if (!NOTIONS.includes(it.notion)) fail(`${where}: invalid notion "${it.notion}"`);
  if (it.answer !== 0) fail(`${where}: answer must be 0`);
  const choices = Array.isArray(it.choices) ? it.choices : [];
  if (choices.length !== 4) fail(`${where}: needs 4 choices`);
  if (choices.some((c) => typeof c !== 'string' || !c.trim())) fail(`${where}: empty choice`);
  if (new Set(choices.map((c) => String(c).trim().toLowerCase())).size !== choices.length) fail(`${where}: duplicate choices`);
  if (choices.some((c) => /toutes les réponses|aucune de ces/i.test(c))) fail(`${where}: meta choice`);
  if (!it.question?.trim() || !it.explanation?.trim()) fail(`${where}: empty question or explanation`);
  if (!String(it.source).startsWith('https://formation-civique.interieur.gouv.fr/fiches-par-thematiques/')) fail(`${where}: source is not an official fiche`);
  if (!String(it.lesson).startsWith(`${THEME}/`) || !existsSync(join(root, `content/lessons/${it.lesson}.md`))) fail(`${where}: lesson "${it.lesson}" not found`);

  if (it.id?.startsWith('CR-')) {
    const ref = officialById.get(it.id);
    if (!ref) fail(`${where}: not an official id of the theme`);
    else if (ref.question !== it.question) fail(`${where}: question text differs from the official text`);
    if (it.official !== true || it.type !== 'connaissance') fail(`${where}: must be official connaissance`);
    if (it.notion === 'principes.situations') fail(`${where}: official question tagged as situation`);
  } else {
    if (!/^SIT-PRI-\d{3}$/.test(it.id)) fail(`${where}: bad situation id`);
    if (it.official !== false || it.type !== 'situation' || it.notion !== 'principes.situations') fail(`${where}: situation fields wrong`);
  }
}
const sitCount = items.filter((it) => it.type === 'situation').length;
if (sitCount !== SITUATIONS) fail(`expected ${SITUATIONS} situations, found ${sitCount}`);

// Lessons: front matter coherent and a closing "À retenir" section of 3 to 5 bullets.
const lessonDir = `content/lessons/${THEME}`;
const lessonFiles = readdirSync(join(root, lessonDir)).filter((f) => f.endsWith('.md'));
for (const f of lessonFiles) {
  const text = read(`${lessonDir}/${f}`);
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '';
  const field = (k) => fm.match(new RegExp(`^${k}: (.+)$`, 'm'))?.[1];
  if (field('id') !== `${THEME}/${f.slice(0, -3)}`) fail(`${f}: id does not match file name`);
  if (field('theme') !== THEME) fail(`${f}: bad theme`);
  if (!NOTIONS.includes(field('notion'))) fail(`${f}: bad notion`);
  if (!field('title')) fail(`${f}: missing title`);
  const minutes = Number(field('minutes'));
  if (!Number.isInteger(minutes) || minutes < 4 || minutes > 8) fail(`${f}: minutes must be 4 to 8`);
  if (!Number.isInteger(Number(field('order')))) fail(`${f}: bad order`);
  if (!/^sources:\n(  - https:\/\/formation-civique\.interieur\.gouv\.fr\/\S+\n?)+/m.test(fm)) fail(`${f}: missing official sources`);
  const tail = text.split('\n## ').pop();
  const bullets = tail.split('\n').filter((l) => l.startsWith('- ')).length;
  if (!tail.startsWith('À retenir') || bullets < 3 || bullets > 5) fail(`${f}: must end with "## À retenir" and 3 to 5 bullets`);
}
const notionsWithLessons = new Set(lessonFiles.map((f) => read(`${lessonDir}/${f}`).match(/^notion: (.+)$/m)?.[1]));
for (const n of NOTIONS) {
  const k = lessonFiles.filter((f) => read(`${lessonDir}/${f}`).includes(`\nnotion: ${n}\n`)).length;
  if (!notionsWithLessons.has(n) || k > 3) fail(`${n}: needs 1 to 3 lessons, found ${k}`);
}

// No em dash anywhere in the files of this theme.
const files = [`content/questions/${THEME}.json`, `docs/content-review/${THEME}.md`, 'scripts/check-principes.mjs', ...lessonFiles.map((f) => `${lessonDir}/${f}`)];
for (const f of files) {
  if (!existsSync(join(root, f))) fail(`${f}: missing`);
  else if (read(f).includes('\u2014')) fail(`${f}: contains an em dash (U+2014)`);
}

if (errors.length) {
  console.error(`check-principes: ${errors.length} error(s)\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
const byNotion = Object.fromEntries(NOTIONS.map((n) => [n, items.filter((it) => it.notion === n).length]));
console.log(`check-principes: OK - ${official.length} official questions, ${sitCount} situations, ${lessonFiles.length} lessons`);
console.log(`by notion: ${JSON.stringify(byNotion)}`);
