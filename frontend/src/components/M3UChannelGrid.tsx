import React from 'react';
import { Tv2 } from 'lucide-react';
import type { M3UChannel } from '../utils/m3uParser';
import M3UChannelCard from './M3UChannelCard';
import { Skeleton } from '@/components/ui/skeleton';

interface M3UChannelGridProps {
    channels: M3UChannel[];
    favouriteIds: Set<string>;
    selectedChannel: M3UChannel | null;
    onSelectChannel: (channel: M3UChannel) => void;
    onToggleFavourite: (id: string) => void;
    isLoading: boolean;
    emptyMessage?: string;
}

function ChannelCardSkeleton() {
    return (
        <div className="bg-card rounded-xl overflow-hidden border border-border">
            <Skeleton className="aspect-video w-full bg-muted" />
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-muted" />
                <Skeleton className="h-3 w-1/2 bg-muted" />
            </div>
        </div>
    );
}

export default function M3UChannelGrid({
    channels,
    favouriteIds,
    selectedChannel,
    onSelectChannel,
    onToggleFavourite,
    isLoading,
    emptyMessage = 'No channels found',
}: M3UChannelGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 18 }).map((_, i) => (
                    <ChannelCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (channels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Tv2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-lg font-semibold text-foreground">{emptyMessage}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Try adjusting your filters or check back later.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {channels.map((channel) => (
                <M3UChannelCard
                    key={channel.id}
                    channel={channel}
                    isFavourite={favouriteIds.has(channel.id)}
                    isSelected={selectedChannel?.id === channel.id}
                    onSelect={onSelectChannel}
                    onToggleFavourite={onToggleFavourite}
                />
            ))}
        </div>
    );
}
