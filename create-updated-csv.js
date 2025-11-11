import fs from 'fs';

// Read the leagues with associations
const leagues = JSON.parse(fs.readFileSync('leagues-with-associations.json', 'utf-8'));

// Create CSV for all associations
const csvHeader = 'League ID,League Name,League Abbreviation,League Location,Association Name,Association Location\n';
const csvRows = [];

leagues.forEach(league => {
  if (league.associations && league.associations.length > 0) {
    league.associations.forEach(assoc => {
      // Escape quotes in fields
      const escapeCsv = (str) => str ? `"${str.replace(/"/g, '""')}"` : '""';

      csvRows.push([
        league.id,
        escapeCsv(league.name),
        escapeCsv(league.abbreviation),
        escapeCsv(league.location),
        escapeCsv(assoc.name),
        escapeCsv(assoc.location)
      ].join(','));
    });
  }
});

fs.writeFileSync('all-associations-updated.csv', csvHeader + csvRows.join('\n'));

console.log(`✓ Created all-associations-updated.csv with ${csvRows.length} associations`);

// Also create a leagues summary CSV
const leaguesCsvHeader = 'ID,Name,Abbreviation,Location,Association Count,URL\n';
const leaguesCsvRows = leagues.map(l => {
  const escapeCsv = (str) => str ? `"${str.replace(/"/g, '""')}"` : '""';
  return [
    l.id,
    escapeCsv(l.name),
    escapeCsv(l.abbreviation),
    escapeCsv(l.location),
    l.associationCount || 0,
    escapeCsv(l.url)
  ].join(',');
});

fs.writeFileSync('leagues-summary-updated.csv', leaguesCsvHeader + leaguesCsvRows.join('\n'));

console.log(`✓ Created leagues-summary-updated.csv with ${leagues.length} leagues`);

// Create statistics
const stats = {
  totalLeagues: leagues.length,
  totalAssociations: csvRows.length,
  leaguesWithAssociations: leagues.filter(l => l.associations && l.associations.length > 0).length,
  leaguesWithoutAssociations: leagues.filter(l => !l.associations || l.associations.length === 0).length,
  topLeaguesByAssociations: leagues
    .sort((a, b) => (b.associationCount || 0) - (a.associationCount || 0))
    .slice(0, 10)
    .map(l => ({ name: l.name, count: l.associationCount }))
};

console.log('\n📊 Updated Statistics:');
console.log(`Total leagues: ${stats.totalLeagues}`);
console.log(`Total associations: ${stats.totalAssociations}`);
console.log(`Leagues with associations: ${stats.leaguesWithAssociations}`);
console.log(`Leagues without associations: ${stats.leaguesWithoutAssociations}`);
console.log('\nTop 10 leagues by association count:');
stats.topLeaguesByAssociations.forEach((l, i) => {
  console.log(`  ${i + 1}. ${l.name}: ${l.count} associations`);
});
