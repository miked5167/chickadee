import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('The Hockey Directory favicon', () => {
  it('uses the selected HD red-line mark', () => {
    const iconPath = path.join(process.cwd(), 'app', 'icon.svg')
    const source = readFileSync(iconPath, 'utf8')

    expect(source).toContain('The Hockey Directory')
    expect(source).toContain('#081b33')
    expect(source).toContain('#c83238')
    expect(existsSync(path.join(process.cwd(), 'app', 'favicon.ico'))).toBe(false)
  })
})
