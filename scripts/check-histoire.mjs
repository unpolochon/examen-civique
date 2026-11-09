// Self-check for the "histoire" theme content. Run: node scripts/check-histoire.mjs
// ponytail: theme-specific script; scripts/validate-content.ts (planned) will generalise it.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const THEME = 'histoire';
const root = join(import.meta.dirname, '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const errors = [];
const fail = (msg) => errors.push(msg);

const official = JSON.parse(read('data/official/cr-questions.json')).questions.filter((q) => q.theme === THEME);
const officialText = new Map(official.map((q) => [q.id, q.question]));
const notions = new Set(read('docs/referentiel.md').match(new RegExp(`\`${THEME}\\.[a-z-]+\``, 'g')).map((s) => s.slice(1, -1)));
const questions = JSON.parse(read(`content/questions/${THEME}.json`));

const seen = new Map();
for (const q of questions) {
  const where = q.id ?? JSON.stringify(q).slice(0, 60);
  seen.set(q.id, (seen.get(q.id) ?? 0) + 1);
  if (q.theme !== THEME) fail(`${where}: theme is ${q.theme}`);
  // The referentiel defines no histoire.situations notion, so a situation item fails here too.
  if (!notions.has(q.notion)) fail(`${where}: notion ${q.notion} is not a ${THEME} notion of docs/referentiel.md`);
  if (q.type === 'connaissance') {
    if (q.official !== true) fail(`${where}: official must be true`);
    if (!officialText.has(q.id)) fail(`${where}: not an official ${THEME} id`);
    else if (q.question !== officialText.get(q.id)) fail(`${where}: question text differs from the official list`);
  } else if (q.type === 'situation') {
    if (!/^SIT-HIS-\d{3}$/.test(q.id)) fail(`${where}: bad situation id`);
    if (q.official !== false) fail(`${where}: official must be false`);
    if (q.notion !== `${THEME}.situations`) fail(`${where}: notion must be ${THEME}.situations`);
  } else fail(`${where}: unknown type ${q.type}`);
  const c = q.choices;
  if (!Array.isArray(c) || c.length !== 4) fail(`${where}: needs exactly 4 choices`);
  else {
    if (c.some((x) => typeof x !== 'string' || !x.trim())) fail(`${where}: empty choice`);
    if (new Set(c.map((x) => x.trim().toLowerCase())).size !== 4) fail(`${where}: duplicate choices`);
  }
  if (q.answer !== 0) fail(`${where}: answer must be 0`);
  if (!q.explanation?.trim()) fail(`${where}: missing explanation`);
  if (!q.source?.startsWith('https://formation-civique.interieur.gouv.fr/')) fail(`${where}: source must be an official fiche`);
  if (!q.lesson?.startsWith(`${THEME}/`) || !existsSync(join(root, 'content/lessons', `${q.lesson}.md`))) fail(`${where}: lesson ${q.lesson} not found`);
}
for (const id of officialText.keys()) if (!seen.has(id)) fail(`${id}: missing`);
for (const [id, n] of seen) if (n > 1) fail(`${id}: appears ${n} times`);

// Lessons: front matter id matches the file, and the body ends with a 3 to 5 bullet "À retenir" section.
const lessonDir = `content/lessons/${THEME}`;
const lessonFiles = readdirSync(join(root, lessonDir)).filter((f) => f.endsWith('.md'));
for (const f of lessonFiles) {
  const text = read(join(lessonDir, f));
  const id = `${THEME}/${f.slice(0, -3)}`;
  if (!text.startsWith(`---\nid: ${id}\ntheme: ${THEME}\n`)) fail(`${f}: front matter must start with id: ${id} and theme`);
  const notion = text.match(/^notion: (.+)$/m)?.[1];
  if (!notions.has(notion)) fail(`${f}: invalid notion ${notion}`);
  for (const key of ['title', 'minutes', 'order', 'sources']) if (!new RegExp(`^${key}:`, 'm').test(text)) fail(`${f}: missing ${key}`);
  const last = text.split(/^## /m).at(-1);
  const bullets = last.split('\n').filter((l) => l.startsWith('- ')).length;
  if (!last.startsWith('À retenir') || bullets < 3 || bullets > 5) fail(`${f}: must end with "## À retenir" and 3 to 5 bullets`);
}

// No em dash (U+2014) in any deliverable, this script included.
const files = [`content/questions/${THEME}.json`, `docs/content-review/${THEME}.md`, 'scripts/check-histoire.mjs', ...lessonFiles.map((f) => join(lessonDir, f))];
for (const f of files) {
  if (!existsSync(join(root, f))) fail(`${f}: missing`);
  else if (read(f).includes('\u2014')) fail(`${f}: contains an em dash`);
}

if (errors.length) {
  console.error(`FAIL: ${errors.length} problem(s)\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
const count = (t) => questions.filter((q) => q.type === t).length;
const flagged = questions.filter((q) => q.review).length;
console.log(`OK: ${count('connaissance')}/${official.length} official questions, ${count('situation')} situations, ${lessonFiles.length} lessons, ${flagged} review flag(s).`);
