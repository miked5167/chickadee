/**
 * Generate placeholder logo images for companies without logos
 * Creates SVG images with company initials
 */

/**
 * Generate a consistent color based on company name
 */
function getColorFromName(name: string): string {
  const colors = [
    '#1e40af', // blue-800
    '#7c2d12', // orange-900
    '#14532d', // green-900
    '#4c1d95', // purple-900
    '#831843', // pink-900
    '#713f12', // amber-900
    '#0c4a6e', // sky-900
    '#7c2d12', // red-900
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Extract initials from company name
 */
function getInitials(name: string): string {
  // Remove common suffixes and words
  const cleanName = name
    .replace(/\b(Inc|LLC|Ltd|Limited|Corp|Corporation|Company|Co|Management|Group|Agency)\b/gi, '')
    .trim();

  // Split by spaces and take first letter of first two words
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);

  if (words.length === 0) {
    return name.substring(0, 2).toUpperCase();
  }

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Generate an SVG placeholder logo
 */
export function generatePlaceholderSVG(companyName: string, size: number = 400): string {
  const initials = getInitials(companyName);
  const backgroundColor = getColorFromName(companyName);
  const fontSize = Math.floor(size * 0.4);

  return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
  <text
    x="50%"
    y="50%"
    dominant-baseline="middle"
    text-anchor="middle"
    fill="white"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="${fontSize}"
    font-weight="600"
  >${initials}</text>
</svg>`.trim();
}

/**
 * Generate a placeholder as a data URL
 */
export function generatePlaceholderDataURL(companyName: string, size: number = 400): string {
  const svg = generatePlaceholderSVG(companyName, size);
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate a placeholder as a Buffer (for file uploads)
 */
export function generatePlaceholderBuffer(companyName: string, size: number = 400): Buffer {
  const svg = generatePlaceholderSVG(companyName, size);
  return Buffer.from(svg, 'utf-8');
}
