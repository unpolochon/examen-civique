import { Marked } from 'marked'
import { frenchSpacing } from '../domain/format.ts'

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Raw HTML written in a lesson is shown as text: only the HTML that marked builds from Markdown reaches the page.
const marked = new Marked({ renderer: { html: ({ text }) => escapeHtml(text) } })

const render = (markdown: string) =>
  frenchSpacing(marked.parse(markdown, { async: false }) as string)
    // Wide tables scroll horizontally; the region is focusable so keyboards can scroll it too.
    .replace(/<table>/g, '<div class="lecon__table" role="region" aria-label="Tableau" tabindex="0"><table>')
    .replace(/<\/table>/g, '</table></div>')

/** Lesson body as HTML, with the final "## À retenir" section rendered apart (without its heading). */
export function renderLesson(body: string): { html: string; retenir: string } {
  const start = body.search(/^## À retenir[ \t]*$/m)
  if (start < 0) return { html: render(body), retenir: '' }
  return { html: render(body.slice(0, start)), retenir: render(body.slice(start).replace(/^.*\n?/, '')) }
}
