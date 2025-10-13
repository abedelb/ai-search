export const generateSlideThumbnail = (
  slideNumber: number,
  documentName: string
): string => {
  const slideId = `${documentName}-${slideNumber}`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225">
      <defs>
        <linearGradient id="bg-gradient-${slideId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(249,250,251);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(243,244,246);stop-opacity:1" />
        </linearGradient>
        <linearGradient id="header-gradient-${slideId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:rgb(0,145,90);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(0,115,72);stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="400" height="225" fill="url(#bg-gradient-${slideId})"/>

      <!-- Header Bar -->
      <rect width="400" height="28" fill="url(#header-gradient-${slideId})"/>

      <!-- Document Name -->
      <text x="12" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" fill="white">
        ${escapeXml(documentName.substring(0, 45))}${documentName.length > 45 ? '...' : ''}
      </text>

      <!-- Slide Number Badge -->
      <circle cx="380" cy="14" r="10" fill="rgba(255,255,255,0.25)"/>
      <text x="380" y="17.5" font-family="system-ui" font-size="9" font-weight="700" fill="white" text-anchor="middle">
        ${slideNumber}
      </text>

      <!-- Content Area -->
      <rect x="15" y="40" width="370" height="170" rx="6" fill="white" opacity="0.95"/>

      <!-- Center Text: Document Name + Slide Number -->
      <text x="200" y="120" font-family="system-ui" font-size="18" font-weight="700" fill="rgb(17,24,39)" text-anchor="middle">
        ${escapeXml(documentName.substring(0, 35))}
      </text>
      ${documentName.length > 35 ? `
      <text x="200" y="142" font-family="system-ui" font-size="18" font-weight="700" fill="rgb(17,24,39)" text-anchor="middle">
        ${escapeXml(documentName.substring(35, 70))}${documentName.length > 70 ? '...' : ''}
      </text>
      <text x="200" y="164" font-family="system-ui" font-size="16" font-weight="600" fill="rgb(107,114,128)" text-anchor="middle">
        Slide ${slideNumber}
      </text>` : `
      <text x="200" y="142" font-family="system-ui" font-size="16" font-weight="600" fill="rgb(107,114,128)" text-anchor="middle">
        Slide ${slideNumber}
      </text>`}

      <!-- Visual Elements -->
      <circle cx="80" cy="185" r="15" fill="rgb(0,145,90)" opacity="0.12"/>
      <circle cx="200" cy="185" r="15" fill="rgb(59,130,246)" opacity="0.12"/>
      <circle cx="320" cy="185" r="15" fill="rgb(249,115,22)" opacity="0.12"/>

      <!-- Footer Line -->
      <line x1="30" y1="205" x2="370" y2="205" stroke="rgb(229,231,235)" stroke-width="1"/>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const escapeXml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};
