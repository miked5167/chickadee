export type Guide = {
  slug: string
  title: string
  description: string
  updated: string
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>
}

export const guides: Guide[] = [
  {
    slug: 'how-to-choose-a-hockey-advisor',
    title: 'How to Choose a Hockey Advisor',
    description: 'A practical due-diligence process for hockey families comparing advisory companies.',
    updated: '2026-08-21',
    sections: [
      { heading: 'Start with the decision you actually face', paragraphs: ['Write down the next decision your family needs help with: development planning, team placement, prep school, junior hockey, college recruiting, or professional guidance. A clear problem makes it easier to identify relevant experience and avoid paying for services you do not need.'] },
      { heading: 'Check fit, evidence, and incentives', paragraphs: ['Ask each company to explain who will work with your family, what the process includes, how often you will communicate, and how success is measured. Separate a company’s own claims from facts you can confirm independently.'], bullets: ['Request recent references from families with similar goals.', 'Ask which leagues, schools, teams, or service providers pay referral fees.', 'Confirm the full fee, cancellation terms, and what happens if circumstances change.', 'Verify credentials or affiliations with the organization that issued them.'] },
      { heading: 'Interview more than one company', paragraphs: ['Comparing two or three companies gives you a better sense of normal pricing, communication style, and service scope. A good advisor should be comfortable with careful questions and should not pressure a family into an immediate decision.'] },
      { heading: 'Keep ownership of the decision', paragraphs: ['An advisor can organize information and provide perspective, but the player and family remain responsible for the final decision. Recheck current league, school, eligibility, and representation rules with the governing organization before acting.'] },
    ],
  },
  {
    slug: 'hockey-advisor-interview-questions',
    title: 'Questions to Ask a Hockey Advisor',
    description: 'A family interview checklist covering experience, process, fees, conflicts, and communication.',
    updated: '2026-08-21',
    sections: [
      { heading: 'Experience and fit', paragraphs: ['The strongest question is not “Who do you know?” but “What experience do you have with players in our situation?”'], bullets: ['Which player ages, levels, positions, and pathways do you work with most often?', 'Who will be our day-to-day contact?', 'Can you share recent references with similar goals?', 'What work do you perform directly, and what is referred to someone else?'] },
      { heading: 'Process and communication', paragraphs: ['Ask for a simple explanation of the first 30, 60, and 90 days. Clarify meeting frequency, response expectations, written deliverables, video review, and how the plan changes after setbacks.'] },
      { heading: 'Fees and conflicts', paragraphs: ['Get the complete commercial arrangement in writing.'], bullets: ['Is the fee hourly, project-based, seasonal, or a retainer?', 'Are travel, showcases, video, or third-party services extra?', 'Do you receive referral fees or compensation from teams, schools, trainers, agents, or events?', 'What is the cancellation and refund policy?'] },
      { heading: 'Red flags', paragraphs: ['Be cautious with guaranteed roster spots, scholarships, contracts, or draft outcomes; pressure to sign immediately; vague deliverables; unwillingness to disclose conflicts; and advice that bypasses current governing-body rules.'] },
    ],
  },
  {
    slug: 'hockey-pathway-overview',
    title: 'Hockey Pathways: A Family Overview',
    description: 'A plain-language framework for thinking about minor, prep, junior, college, university, and professional routes.',
    updated: '2026-08-21',
    sections: [
      { heading: 'There is no single correct route', paragraphs: ['Players develop at different rates, and the best next environment depends on ice time, coaching, competition, academics, finances, geography, and personal goals. A more prestigious label is not automatically a better development setting.'] },
      { heading: 'Evaluate the next environment', paragraphs: ['Compare the role a player is likely to earn, practice quality, coaching access, schedule, travel, education support, cost, and the realistic alternatives if the season does not go as planned.'] },
      { heading: 'Understand the major transitions', paragraphs: ['Families commonly research transitions from minor hockey to prep or junior, from junior or prep to college or university, and from amateur programs toward professional opportunities. Rules and eligibility can change, so verify current requirements with the relevant league, school, or governing body.'] },
      { heading: 'Build a decision file', paragraphs: ['Keep written notes for each option: confirmed offer details, deadlines, costs, academic implications, development plan, contacts, and unanswered questions. This prevents urgency and sales pressure from replacing evidence.'] },
    ],
  },
  {
    slug: 'understanding-hockey-advisor-fees',
    title: 'Understanding Hockey Advisor Fees',
    description: 'How to compare pricing models, total cost, deliverables, and conflicts before signing.',
    updated: '2026-08-21',
    sections: [
      { heading: 'Common pricing structures', paragraphs: ['Directory companies may charge hourly fees, a one-time project fee, a seasonal package, or an ongoing retainer. Price alone does not reveal value; compare the exact work included and who performs it.'] },
      { heading: 'Calculate the total commitment', paragraphs: ['Ask whether travel, tournaments, video, testing, introductions, contract review, and third-party services are included. Write down the minimum term, renewal rules, cancellation terms, and possible extra costs.'] },
      { heading: 'Ask how the company is paid', paragraphs: ['A family should understand whether the advisor receives any compensation from other organizations connected to a recommendation. A disclosed conflict can be evaluated; a hidden conflict cannot.'] },
      { heading: 'Compare the same scope', paragraphs: ['Use a short table with service scope, access, deliverables, term, total expected cost, cancellation terms, and conflicts. Avoid comparing a limited assessment to a full-season service as if they were the same product.'] },
    ],
  },
]

export function guideBySlug(slug: string) {
  return guides.find((guide) => guide.slug === slug)
}
