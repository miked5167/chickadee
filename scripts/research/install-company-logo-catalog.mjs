#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..', '..')
const candidateSummaryPath = join(projectRoot, '.firecrawl', 'logo-candidates-20261002', 'summary.json')
const publicLogoRoot = join(projectRoot, 'public', 'company-logos')
const catalogPath = join(projectRoot, 'lib', 'branding', 'company-logo-catalog.json')
const reviewedAt = '2026-10-02'

if (!existsSync(candidateSummaryPath)) throw new Error(`Missing candidate summary: ${candidateSummaryPath}`)
mkdirSync(publicLogoRoot, { recursive: true })
const summary = JSON.parse(readFileSync(candidateSummaryPath, 'utf8'))
const catalog = {}

for (const candidate of summary.candidates) {
  const fileName = `${candidate.slug}.png`
  if (basename(candidate.output.path) !== fileName) {
    throw new Error(`Unexpected candidate filename for ${candidate.slug}`)
  }
  const destination = join(publicLogoRoot, fileName)
  copyFileSync(candidate.output.path, destination)
  catalog[candidate.slug] = {
    src: `/company-logos/${fileName}`,
    website: candidate.website,
    sourcePage: candidate.sourcePage,
    sourceImage: candidate.sourceImage,
    sourceKind: candidate.sourceKind,
    sourceBrandName: candidate.brandName,
    sourceLogoAlt: candidate.logoAlt,
    reviewedAt,
    background: candidate.background,
    sha256: candidate.output.sha256,
  }
}

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
console.log(`Installed ${Object.keys(catalog).length} reviewed logos in ${publicLogoRoot}`)
console.log(`Wrote source catalog: ${catalogPath}`)
