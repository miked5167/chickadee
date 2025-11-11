import fs from 'fs';

// Read the markdown content
const markdown = fs.readFileSync('leagues-content.md', 'utf-8');

// Extract all league entries - they follow this pattern:
// [**Name**\
// \
// Abbr |\
// Location](URL)
const leaguePattern = /\[\*\*([^\*]+)\*\*[^\n]*\n[^\n]*\n([^|]+)\s*\|[^\n]*\n([^\]]+)\]\((https:\/\/myhockeyrankings\.com\/league-info\?l=\d+)\)/g;

const leagues = [];
let match;

while ((match = leaguePattern.exec(markdown)) !== null) {
  const [_, name, abbreviation, location, url] = match;
  const leagueId = url.match(/l=(\d+)/)[1];

  leagues.push({
    id: parseInt(leagueId),
    name: name.trim(),
    abbreviation: abbreviation.replace(/\\/g, '').trim(),
    location: location.replace(/\\/g, '').trim(),
    url: url
  });
}

// Sort by ID
leagues.sort((a, b) => a.id - b.id);

console.log(`\nExtracted ${leagues.length} leagues\n`);
console.log('First 10 leagues:');
leagues.slice(0, 10).forEach(l => {
  console.log(`  ${l.id}: ${l.name} (${l.abbreviation}) - ${l.location}`);
});

// Save to file
fs.writeFileSync('leagues-parsed.json', JSON.stringify(leagues, null, 2));
console.log(`\n✓ Saved ${leagues.length} leagues to leagues-parsed.json`);

// Also create a CSV version
const csvHeader = 'ID,Name,Abbreviation,Location,URL\n';
const csvRows = leagues.map(l =>
  `${l.id},"${l.name}","${l.abbreviation}","${l.location}","${l.url}"`
).join('\n');

fs.writeFileSync('leagues-parsed.csv', csvHeader + csvRows);
console.log(`✓ Saved ${leagues.length} leagues to leagues-parsed.csv`);

// Group by location type
const byLocation = leagues.reduce((acc, league) => {
  const location = league.location;
  if (!acc[location]) {
    acc[location] = [];
  }
  acc[location].push(league.name);
  return acc;
}, {});

console.log(`\n\nLeagues grouped by ${Object.keys(byLocation).length} unique locations`);
console.log('\nTop 15 locations by number of leagues:');
Object.entries(byLocation)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 15)
  .forEach(([location, leagueList]) => {
    console.log(`  ${location}: ${leagueList.length} leagues`);
  });
