import { useState, useCallback } from 'react';
import type { M3UChannel } from '../utils/m3uParser';

let manualIdCounter = 0;

export interface ManualChannelInput {
  name: string;
  streamUrl: string;
  thumbnailUrl?: string;
  language?: string;
  country?: string;
}

export function useManualChannels() {
  const [manualChannels, setManualChannels] = useState<M3UChannel[]>([]);

  const addChannel = useCallback((input: ManualChannelInput) => {
    const channel: M3UChannel = {
      id: `manual-${Date.now()}-${manualIdCounter++}`,
      name: input.name.trim(),
      streamUrl: input.streamUrl.trim(),
      thumbnailUrl: input.thumbnailUrl?.trim() || '',
      language: input.language?.trim() || '',
      country: input.country?.trim() || '',
    };
    setManualChannels((prev) => [channel, ...prev]);
    return channel;
  }, []);

  return { manualChannels, addChannel };
}
