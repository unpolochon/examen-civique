// Validates content/ (npm run validate:content). Same checks as src/content/content.test.ts.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { validateContent } from '../src/content/validate.ts'

const root = join(import.meta.dirname, '..')
const contentDir = join(root, 'content')
const files: Record<string, string> = {}
if (existsSync(contentDir)) {
  for (const entry of readdirSync(contentDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || entry.name.startsWith('.')) continue
    const path = join(entry.parentPath, entry.name)
    files[relative(contentDir, path).split(sep).join('/')] = readFileSync(path, 'utf8')
  }
}
const official = JSON.parse(readFileSync(join(root, 'data/official/cr-questions.json'), 'utf8')).questions

const errors = validateContent(files, official)
for (const error of errors) console.error(error)
console.log(errors.length ? `${errors.length} erreur(s) dans content/` : `content/ valide (${Object.keys(files).length} fichiers)`)
process.exit(errors.length ? 1 : 0)
