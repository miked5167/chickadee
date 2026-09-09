#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..', '..')
const inputPath = join(projectRoot, 'data', 'enrichment', 'advisor-research-20260822', 'first-pass.json')
const firecrawlCommand = process.platform === 'win32' ? process.execPath : 'firecrawl'
const firecrawlCli = process.platform === 'win32'
  ? join(process.env.APPDATA || '', 'npm', 'node_modules', 'firecrawl-cli', 'dist', 'index.js')
  : null
const requestIntervalMs = 22_000

function runFirecrawl(args, logPath) {
  return new Promise((resolvePromise) => {
    const log = createWriteStream(logPath, { flags: 'a' })
    const commandArguments = firecrawlCli ? [firecrawlCli, ...args] : args
    const child = spawn(firecrawlCommand, commandArguments, {
      cwd: projectRoot,
      env: process.env,
      windowsHide: true,
      shell: false,
    })
    child.stdout.pipe(log)
    child.stderr.pipe(log)
    child.on('close', (code) => {
      log.end()
      resolvePromise(code ?? 1)
    })
  })
}

const records = JSON.parse(readFileSync(inputPath, 'utf8'))
const candidates = records.filter((record) =>
  record.google_business?.place_url
  && ['confirmed', 'possible'].includes(record.google_business.match_status),
)

console.log(`Checking ${candidates.length} exact Google place pages.`)
for (const [index, record] of candidates.entries()) {
  const outputPath = join(record.evidence_directory, 'google-place-followup.md')
  const logPath = join(record.evidence_directory, 'google-place-followup.log')
  if (existsSync(outputPath)) {
    console.log(`[${index + 1}/${candidates.length}] ${record.listing_name}: already complete`)
    continue
  }
  console.log(`[${index + 1}/${candidates.length}] ${record.listing_name}: checking exact place`)
  await runFirecrawl([
    'scrape', record.google_business.place_url,
    '--wait-for', '3500',
    '--only-main-content',
    '--format', 'markdown',
    '--json',
    '--pretty',
    '-o', outputPath,
  ], logPath)
  if (index < candidates.length - 1) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, requestIntervalMs))
  }
}

console.log('Google place follow-ups complete.')
