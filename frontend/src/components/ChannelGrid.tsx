import React from 'react';
import { Tv2 } from 'lucide-react';
import type { Channel } from '../backend';
import ChannelCard from './ChannelCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ChannelGridProps {
    channels: Channel[];
    favouriteIds: Set<string>;
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
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

export default function ChannelGrid({
    channels,
    favouriteIds,
    selectedChannel,
    onSelectChannel,
    isLoading,
    emptyMessage = 'No channels found',
}: ChannelGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
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
                <ChannelCard
                    key={channel.id.toString()}
                    channel={channel}
                    isFavourite={favouriteIds.has(channel.id.toString())}
                    isSelected={selectedChannel?.id === channel.id}
                    onSelect={onSelectChannel}
                />
            ))}
        </div>
    );
}
