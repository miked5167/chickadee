import type { DirectoryTag } from './types'

const patterns: Record<string, RegExp> = {
  'services:advisor': /\b(?:hockey advis(?:ors?|ing|ory)|family advis(?:ors?|ing)|player advis(?:ors?|ing))\b/i,
  'services:agent': /\b(?:player representation|athlete representation|agent representation|contract negotiations?|sports agents?|hockey agents?)\b/i,
  'services:scouting': /\b(?:scouting|player evaluations?|player assessments?)\b/i,
  'services:video': /\b(?:video analysis|video review|film analysis)\b/i,
  'services:recruiting': /\b(?:recruiting|recruitment|player placement|team placement)\b/i,
  'services:skills-coaching': /\b(?:skills coaching|skills development|skill development|on.ice training)\b/i,
  'pathways:prep-school': /\b(?:prep school|preparatory school)\b/i,
  'pathways:junior': /\b(?:junior hockey|USHL|NAHL|CHL|OHL|WHL|QMJHL|BCHL|AJHL)\b/i,
  'pathways:ncaa': /\bNCAA\b/i,
  'pathways:u-sports': /\bU[ -]?SPORTS\b/i,
  'pathways:professional': /\b(?:professional hockey|NHL|AHL|ECHL)\b/i,
  'player_level:aa': /\bAA\b/i,
  'player_level:aaa': /\bAAA\b/i,
  'player_level:prep-high-school': /\b(?:prep school players?|high school players?|high school hockey)\b/i,
  'player_level:junior': /\bjunior (?:hockey )?players?\b/i,
  'player_level:college-university': /\b(?:college|university) (?:hockey )?(?:players?|athletes?)\b/i,
  'player_level:professional': /\bprofessional (?:hockey )?(?:players?|athletes?)\b/i,
  'age_group:13-14': /\b(?:ages? 13[–-]14|13[–-]14.year.old)\b/i,
  'age_group:15-17': /\b(?:ages? 15[–-]17|15[–-]17.year.old)\b/i,
  'age_group:18-20': /\b(?:ages? 18[–-]20|18[–-]20.year.old)\b/i,
  'age_group:21-plus': /\b(?:ages? 21\+(?=\s|[.,;!?]|$)|21 and (?:older|over)\b)/i,
  'languages:english': /\b(?:languages?[^.!?]{0,30}|speak[^.!?]{0,20}|consultations? in )English\b/i,
  'languages:french': /\b(?:languages?[^.!?]{0,30}|speak[^.!?]{0,20}|consultations? in )French\b/i,
}
export type TagEvidence = { tag_id: string; label: string; source: string; excerpt: string; confidence: 'review_required' }
export function proposeDirectoryTags(catalog: DirectoryTag[], sources: Array<{ source: string; text: string }>): TagEvidence[] {
  const proposed: TagEvidence[] = []
  for (const tag of catalog.filter((tag) => tag.is_active && tag.group_key !== 'price_range')) {
    const pattern = patterns[tag.id] || (tag.group_key === 'regions' ? new RegExp(`\\b(?:serve|serving|work with (?:players|families)|clients? (?:in|across))[^.!?]{0,60}\\b${tag.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i') : null)
    if (!pattern) continue
    for (const { source, text } of sources) {
      const match = pattern.exec(text)
      if (!match) continue
      const start = Math.max(0, match.index - 80)
      const excerpt = text.slice(start, match.index + match[0].length + 100).replace(/\s+/g, ' ').trim()
      if (/\b(?:do not|does not|don't|doesn't|not (?:offer|provide|serve)|no longer|never)\b/i.test(excerpt)) continue
      proposed.push({ tag_id: tag.id, label: tag.label, source, excerpt, confidence: 'review_required' })
      break
    }
  }
  return proposed
}
export function csvCell(value: unknown) {
  const text = String(value ?? '')
  // Keep public website text from becoming a spreadsheet formula.
  return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`
}
