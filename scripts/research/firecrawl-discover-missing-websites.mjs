#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..', '..')
const inputPath = join(projectRoot, 'data', 'enrichment', 'advisor-research-20260822', 'advisor-enrichment.json')
const firecrawlCommand = process.platform === 'win32' ? process.execPath : 'firecrawl'
const firecrawlCli = process.platform === 'win32'
  ? join(process.env.APPDATA || '', 'npm', 'node_modules', 'firecrawl-cli', 'dist', 'index.js')
  : null

function runSearch(query) {
  return new Promise((resolvePromise) => {
    const args = ['search', query, '--limit', '5', '--json']
    const commandArguments = firecrawlCli ? [firecrawlCli, ...args] : args
    const child = spawn(firecrawlCommand, commandArguments, {
      cwd: projectRoot,
      env: process.env,
      windowsHide: true,
      shell: false,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('close', (code) => resolvePromise({ code: code ?? 1, stdout, stderr }))
  })
}

const records = JSON.parse(readFileSync(inputPath, 'utf8'))
const candidates = records.filter((record) => record.site_capture_status !== 'captured')

console.log(`Searching for current website candidates for ${candidates.length} listings.`)
for (const [index, record] of candidates.entries()) {
  const outputPath = join(record.evidence_directory, 'website-discovery.json')
  if (existsSync(outputPath)) {
    console.log(`[${index + 1}/${candidates.length}] ${record.listing_name}: already searched`)
    continue
  }

  const query = `"${record.listing_name}" hockey advisor agency`
  console.log(`[${index + 1}/${candidates.length}] ${record.listing_name}`)
  const result = await runSearch(query)
  let payload
  try {
    payload = JSON.parse(result.stdout)
  } catch {
    payload = { success: false, data: { web: [] } }
  }
  mkdirSync(record.evidence_directory, { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify({
    listing_name: record.listing_name,
    query,
    exit_code: result.code,
    results: payload?.data?.web || [],
    searched_at: new Date().toISOString(),
    error: result.code === 0 ? null : result.stderr.slice(0, 500),
  }, null, 2)}\n`, 'utf8')

  if (index < candidates.length - 1) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 6_500))
  }
}

console.log('Missing-website discovery complete.')
