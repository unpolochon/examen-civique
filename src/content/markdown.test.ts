import { expect, test } from 'vitest'
import { renderLesson } from './markdown'

test('renderLesson sépare la section « À retenir » du corps', () => {
  const { html, retenir } = renderLesson('Intro **gras**.\n\n## Partie\n\n- un\n- deux\n\n## À retenir\n\n- point clé')
  expect(html).toContain('<p>Intro <strong>gras</strong>.</p>')
  expect(html).toContain('<h2>Partie</h2>')
  expect(html).toContain('<li>deux</li>')
  expect(html).not.toContain('retenir')
  expect(retenir.trim()).toBe('<ul>\n<li>point clé</li>\n</ul>')
})

test('renderLesson enveloppe les tableaux dans une zone défilante', () => {
  const { html } = renderLesson('| A | B |\n|---|---|\n| 1 | 2 |\n\n## À retenir\n\n- x')
  expect(html).toMatch(/^<div class="lecon__table" role="region" aria-label="Tableau" tabindex="0"><table>/)
  expect(html.trim()).toMatch(/<\/table><\/div>$/)
})

test('renderLesson affiche le HTML brut comme du texte', () => {
  const { html } = renderLesson('<script>alert(1)</script>\n\nTexte <img src=x onerror=alert(1)> fin.')
  expect(html).not.toContain('<script')
  expect(html).not.toContain('<img')
  expect(html).toContain('&lt;script&gt;')
})

test('renderLesson sans section « À retenir »', () => {
  expect(renderLesson('Texte.')).toEqual({ html: '<p>Texte.</p>\n', retenir: '' })
})

test('renderLesson met des espaces insécables devant la ponctuation double', () => {
  const { html, retenir } = renderLesson('Le vote : un droit ? Oui !\n\n## À retenir\n\n- « Liberté »')
  expect(html).toContain('<p>Le vote\u00a0: un droit\u00a0? Oui\u00a0!</p>')
  expect(retenir).toContain('«\u00a0Liberté\u00a0»')
})
