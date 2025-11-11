import fs from 'fs';

// Read the markdown content
const markdown = fs.readFileSync('leagues-content.md', 'utf-8');

// Find one example and show its exact characters
const sampleStart = markdown.indexOf('[**Hockey Abitibi');
const sampleEnd = markdown.indexOf(')', sampleStart) + 1;
const sample = markdown.substring(sampleStart, sampleEnd);

console.log('Sample league entry:');
console.log(sample);
console.log('\nCharacter codes:');
console.log(sample.split('').map((c, i) => `${i}: '${c}' (${c.charCodeAt(0)})`).slice(0, 100).join('\n'));

// Try a different regex approach - split by lines and look for patterns
const lines = markdown.split('\n');
const leagues = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Look for lines that start with [** and contain league-info
  if (line.includes('[**') && line.includes('league-info')) {
    // Extract using simpler pattern
    const nameMatch = line.match(/\[\*\*([^\*]+)\*\*/);
    const urlMatch = line.match(/(https:\/\/myhockeyrankings\.com\/league-info\?l=\d+)/);

    if (nameMatch && urlMatch) {
      const name = nameMatch[1];
      const url = urlMatch[1];
      const leagueId = url.match(/l=(\d+)/)[1];

      // The abbreviation and location are between the name and the URL
      const middlePart = line.substring(line.indexOf('**') + name.length + 2, line.indexOf(']('));

      // Split by pipe to get abbreviation and location
      const parts = middlePart.split('|');
      let abbreviation = '';
      let location = '';

      if (parts.length >= 2) {
        abbreviation = parts[0].replace(/\\/g, '').trim();
        location = parts[1].replace(/\\/g, '').trim();
      }

      leagues.push({
        id: parseInt(leagueId),
        name: name.trim(),
        abbreviation: abbreviation,
        location: location,
        url: url
      });
    }
  }
}

console.log(`\n\nExtracted ${leagues.length} leagues`);
console.log('\nFirst 5 leagues:');
console.log(JSON.stringify(leagues.slice(0, 5), null, 2));

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
