export interface M3UChannel {
  id: string;
  name: string;
  streamUrl: string;
  language: string;
  country: string;
  thumbnailUrl: string;
}

function extractAttr(extinf: string, attr: string): string {
  const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
  const match = extinf.match(regex);
  return match ? match[1].trim() : '';
}

export function parseM3U(text: string): M3UChannel[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const channels: M3UChannel[] = [];

  let currentExtinf = '';
  let idCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      currentExtinf = line;
    } else if (currentExtinf && !line.startsWith('#')) {
      // This is a stream URL
      const streamUrl = line;

      // Extract channel name (after the last comma in #EXTINF)
      const commaIdx = currentExtinf.lastIndexOf(',');
      const name = commaIdx >= 0 ? currentExtinf.slice(commaIdx + 1).trim() : 'Unknown Channel';

      // Extract attributes
      const logo = extractAttr(currentExtinf, 'tvg-logo');
      const language =
        extractAttr(currentExtinf, 'tvg-language') ||
        extractAttr(currentExtinf, 'group-title') ||
        '';
      const country = extractAttr(currentExtinf, 'tvg-country') || '';

      if (name && streamUrl) {
        channels.push({
          id: `m3u-${idCounter++}`,
          name,
          streamUrl,
          language,
          country,
          thumbnailUrl: logo,
        });
      }

      currentExtinf = '';
    }
  }

  return channels;
}
