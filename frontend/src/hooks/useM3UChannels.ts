import { useQuery } from '@tanstack/react-query';
import { parseM3U, type M3UChannel } from '../utils/m3uParser';

const DEFAULT_M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';
const CORS_PROXY = 'https://corsproxy.io/?url=';

async function fetchM3U(url: string): Promise<string> {
  // Try direct fetch first
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok) {
      const text = await response.text();
      if (text.includes('#EXTM3U')) {
        return text;
      }
    }
  } catch {
    // Direct fetch failed, fall through to proxy
  }

  // Fallback: CORS proxy
  const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
  const response = await fetch(proxiedUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch M3U playlist: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  if (!text.includes('#EXTM3U')) {
    throw new Error('Invalid M3U playlist: missing #EXTM3U header');
  }
  return text;
}

export function useM3UChannels(url: string = DEFAULT_M3U_URL) {
  return useQuery<M3UChannel[]>({
    queryKey: ['m3u-channels', url],
    queryFn: async () => {
      const text = await fetchM3U(url);
      return parseM3U(text);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });
}
