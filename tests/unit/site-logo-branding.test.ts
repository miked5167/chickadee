import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectPath = (...parts: string[]) => path.join(process.cwd(), ...parts)

describe('The Hockey Directory primary logo', () => {
  it('ships the approved light, dark, responsive, vector, and social assets', () => {
    const assets = [
      'the-hockey-directory-primary.png',
      'the-hockey-directory-primary.svg',
      'the-hockey-directory-header.png',
      'the-hockey-directory-mobile.png',
      'the-hockey-directory-reversed.png',
      'the-hockey-directory-reversed.svg',
      'the-hockey-directory-reversed-footer.png',
      'the-hockey-directory-social.png',
    ]

    for (const asset of assets) {
      expect(existsSync(projectPath('public', 'brand', asset)), asset).toBe(true)
    }
  })

  it('uses the approved logo in the header, footer, metadata, and organization schema', () => {
    const header = readFileSync(projectPath('components', 'layout', 'Header.tsx'), 'utf8')
    const footer = readFileSync(projectPath('components', 'layout', 'Footer.tsx'), 'utf8')
    const layout = readFileSync(projectPath('app', 'layout.tsx'), 'utf8')
    const home = readFileSync(projectPath('app', 'page.tsx'), 'utf8')

    expect(header).toContain('/brand/the-hockey-directory-header.png')
    expect(footer).toContain('/brand/the-hockey-directory-reversed-footer.png')
    expect(layout).toContain('/brand/the-hockey-directory-social.png')
    expect(home).toContain('/brand/the-hockey-directory-primary.png')
  })

  it('keeps the compact favicon mark for browser-tab sizes', () => {
    const favicon = readFileSync(projectPath('app', 'icon.svg'), 'utf8')

    expect(favicon).toContain('#081b33')
    expect(favicon).toContain('#c83238')
  })
})
