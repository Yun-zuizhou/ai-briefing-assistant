import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const cssPath = resolve(here, '../src/styles/bookish-decor.css')
const css = readFileSync(cssPath, 'utf8')

const forbidden = [
  '--font-serif-cn',
  '--font-sans-cn',
  '--font-latin-elegant',
].flatMap((token) => [
  `font-family: var(${token})`,
  `font-family: var(${token}),`,
])

const offenders = forbidden.filter((pattern) => css.includes(pattern))

if (offenders.length > 0) {
  console.error('Decor font role check failed.')
  console.error('Use --bookish-font-* role tokens instead of direct primitive font tokens:')
  for (const offender of offenders) {
    console.error(`- ${offender}`)
  }
  process.exit(1)
}

console.log('Decor font role check passed: bookish-decor.css uses --bookish-font-* roles.')
