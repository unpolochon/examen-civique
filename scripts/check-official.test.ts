import { describe, expect, it } from 'vitest'
import { compare, parseDataset, parseOfficialPage } from './check-official.ts'

const page = `
<nav><ol><li>Accueil</li><li>Examen civique</li></ol></nav>
<p>Voici les questions de connaissances.</p><ul><li>Pas une question</li></ul>
<div><p data-block-key="a"><b>Principes et valeurs de la République :</b></p>
<ul><li data-block-key="b">Que garantit la liberté d’expression ?</li><li>Qu&#x27;est-ce que la <b>laïcité</b> ?</li></ul></div>
<div><p><b>Vivre dans la société française :</b></p><ul><li>Quel est l&#39;âge de la majorité ? </li></ul></div>
<footer><ul><li>Mentions légales</li></ul></footer>`

describe('parseOfficialPage', () => {
  it('extracts questions per theme, between headings and footer', () => {
    expect(parseOfficialPage(page)).toEqual([
      { theme: 'principes', question: 'Que garantit la liberté d’expression ?' },
      { theme: 'principes', question: "Qu'est-ce que la laïcité ?" },
      { theme: 'societe', question: "Quel est l'âge de la majorité ?" },
    ])
  })

  it('fails on an unknown theme heading', () => {
    expect(() => parseOfficialPage('<p>Nouvelle thématique :</p><ul><li>Q ?</li></ul>')).toThrow(/inconnue/)
  })
})

describe('parseDataset', () => {
  it('maps theme names to ids', () => {
    const json = { data: [{ theme: 'Droits et devoirs', questions: [{ question: 'Que signifie PMA ? ' }] }] }
    expect(parseDataset(json)).toEqual([{ theme: 'droits', question: 'Que signifie PMA ?' }])
  })
})

describe('compare', () => {
  it('ignores apostrophe, case, and spacing differences, reports the rest', () => {
    const local = [
      { theme: 'principes', question: 'Que garantit la liberté d’expression ?' },
      { theme: 'societe', question: 'Ancienne question ?' },
    ]
    const source = [
      { theme: 'principes', question: "que garantit  la liberté d'expression ?" },
      { theme: 'societe', question: 'Nouvelle question ?' },
    ]
    expect(compare(local, source)).toEqual({ added: [source[1]], removed: [local[1]] })
  })
})
