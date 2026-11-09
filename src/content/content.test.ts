import { describe, expect, test } from 'vitest'
import official from '../../data/official/cr-questions.json'
import { EXAM_GRID, EXAM_QUESTIONS } from '../domain/types'
import { lessonById, lessons, questionById, questions } from './index'
import { parseLesson } from './parse'
import { validateContent } from './validate'

/** Maps a raw glob result to paths relative to the given folder. */
function relativeTo(prefix: string, files: Record<string, string>) {
  return Object.fromEntries(Object.entries(files).map(([path, text]) => [path.slice(prefix.length), text]))
}

const content = relativeTo(
  '/content/',
  import.meta.glob<string>('/content/**/*', { eager: true, query: '?raw', import: 'default' }),
)
const fixture = relativeTo(
  './__fixtures__/valid/',
  import.meta.glob<string>('./__fixtures__/valid/**/*', { eager: true, query: '?raw', import: 'default' }),
)

test('le contenu de content/ est valide', () => {
  expect(validateContent(content, official.questions)).toEqual([])
})

test('le chargeur expose toutes les questions et leçons de content/', () => {
  const files = Object.keys(content)
  expect(lessons).toHaveLength(files.filter((f) => f.startsWith('lessons/')).length)
  expect(lessonById.size).toBe(lessons.length)
  expect(questionById.size).toBe(questions.length)
})

test('la grille de l’article 3 compte 40 questions', () => {
  expect(Object.values(EXAM_GRID).reduce((a, b) => a + b, 0)).toBe(EXAM_QUESTIONS)
})

describe('validateContent', () => {
  const smallOfficial = [
    { id: 'CR-011', theme: 'principes' },
    { id: 'CR-500', theme: 'histoire' },
  ]
  const fixtureQuestions = () => JSON.parse(fixture['questions/principes.json'])

  test('accepte le jeu de test valide, sans exiger la grille des thèmes vides', () => {
    expect(validateContent(fixture, smallOfficial)).toEqual([])
  })

  test('accepte un dossier vide', () => {
    expect(validateContent({}, official.questions)).toEqual([])
  })

  test('signale toutes les erreurs à la fois', () => {
    const questions = fixtureQuestions()
    questions[0].choices = ['A', 'a', 'B', '']
    questions[0].answer = 4
    questions[1].id = 'CR-011'
    questions[3].type = 'situation'
    questions[4].lesson = 'principes/absente'
    questions[5].notion = 'histoire.periodes'
    const errors = validateContent(
      {
        ...fixture,
        'lessons/principes/symboles.md': fixture['lessons/principes/symboles.md'].replace('Marianne', 'Marianne \u2014'),
        'questions/principes.json': JSON.stringify(questions),
      },
      [...smallOfficial, { id: 'CR-012', theme: 'principes' }],
    )
    expect(errors).toEqual([
      'lessons/principes/symboles.md:14 : tiret cadratin interdit, utiliser « - »',
      'questions/principes.json (CR-011) : il faut exactement 4 choix non vides',
      'questions/principes.json (CR-011) : answer doit être 0, 1, 2 ou 3',
      'questions/principes.json (CR-011) : id en double',
      'questions/principes.json (P-03) : une mise en situation doit avoir une notion *.situations',
      'questions/principes.json (P-04) : leçon « principes/absente » introuvable',
      'questions/principes.json (P-S1) : notion « histoire.periodes » invalide pour le thème',
      'questions/principes.json (P-S1) : une mise en situation doit avoir une notion *.situations',
      'questions/principes.json : question(s) officielle(s) manquante(s) : CR-012',
      'notion principes.situations : 5 question(s), il en faut au moins 6 pour un examen',
    ])
  })

  test('refuse des choix identiques, une leçon sans « À retenir » et un JSON illisible', () => {
    const questions = fixtureQuestions()
    questions[0].choices = ['A', 'B', 'C', ' a ']
    const errors = validateContent(
      {
        ...fixture,
        'lessons/principes/symboles.md': fixture['lessons/principes/symboles.md'].replace('## À retenir', '## Résumé'),
        'questions/principes.json': JSON.stringify(questions),
        'questions/histoire.json': '[{',
      },
      smallOfficial,
    )
    expect(errors).toEqual([
      'lessons/principes/symboles.md (principes/symboles) : section « ## À retenir » manquante',
      expect.stringMatching(/^questions\/histoire\.json : JSON invalide/),
      'questions/principes.json (CR-011) : les 4 choix doivent être distincts',
    ])
  })
})

describe('parseLesson', () => {
  test('lit l’en-tête et le corps', () => {
    const lesson = parseLesson(fixture['lessons/principes/symboles.md'].replace(/\n/g, '\r\n'))
    expect({ ...lesson, body: lesson.body.split('\n')[0] }).toEqual({
      id: 'principes/symboles',
      theme: 'principes',
      notion: 'principes.devise-symboles',
      title: 'Les symboles de la République : drapeau, hymne, devise',
      minutes: 5,
      order: 2,
      sources: ['https://www.elysee.fr/la-presidence/les-symboles-de-la-republique-francaise', 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000052381620/'],
      body: '# Les symboles de la République',
    })
  })

  test.each([
    ['sans en-tête', '# Titre', 'en-tête manquant (bloc entre deux lignes ---)'],
    ['champ manquant', '---\nid: a/b\n---\ncorps', 'champ « theme » manquant dans l\'en-tête'],
    ['minutes invalide', '---\nid: a\ntheme: a\nnotion: a\ntitle: a\nminutes: cinq\norder: 1\n---\n', '« minutes » doit être un entier positif'],
    ['ligne illisible', '---\nid a\n---\n', 'ligne d\'en-tête illisible : « id a »'],
  ])('refuse un fichier %s', (_, text, message) => {
    expect(() => parseLesson(text)).toThrow(message)
  })
})
