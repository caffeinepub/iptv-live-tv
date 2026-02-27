import React from 'react';
import { Heart } from 'lucide-react';
import type { Channel } from '../backend';
import { useToggleFavourite } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface ChannelCardProps {
    channel: Channel;
    isFavourite: boolean;
    isSelected: boolean;
    onSelect: (channel: Channel) => void;
}

export default function ChannelCard({ channel, isFavourite, isSelected, onSelect }: ChannelCardProps) {
    const { identity } = useInternetIdentity();
    const toggleFavourite = useToggleFavourite();
    const isAuthenticated = !!identity;

    const handleFavouriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) return;
        toggleFavourite.mutate(channel.id);
    };

    return (
        <article
            onClick={() => onSelect(channel)}
            className={`
                group relative bg-card rounded-xl overflow-hidden cursor-pointer card-glow border
                ${isSelected
                    ? 'border-primary shadow-glow-red'
                    : 'border-border hover:border-primary/40'
                }
            `}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-muted overflow-hidden">
                <img
                    src={channel.thumbnailUrl || '/assets/generated/channel-placeholder.dim_320x180.png'}
                    alt={channel.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/generated/channel-placeholder.dim_320x180.png';
                    }}
                    loading="lazy"
                />

                {/* Live badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse-red" />
                    <span className="text-[10px] font-bold text-primary-foreground tracking-widest uppercase">Live</span>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">
                            <span className="text-2xl">▶</span>
                        </div>
                    </div>
                )}

                {/* Favourite button */}
                <button
                    onClick={handleFavouriteClick}
                    disabled={!isAuthenticated || toggleFavourite.isPending}
                    className={`
                        absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center
                        transition-all duration-200
                        ${!isAuthenticated
                            ? 'bg-black/30 opacity-40 cursor-not-allowed'
                            : isFavourite
                                ? 'bg-primary/90 hover:bg-primary shadow-glow-red'
                                : 'bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100'
                        }
                        ${toggleFavourite.isPending ? 'opacity-50' : ''}
                    `}
                    title={
                        !isAuthenticated
                            ? 'Sign in to save favourites'
                            : isFavourite
                                ? 'Remove from favourites'
                                : 'Add to favourites'
                    }
                >
                    <Heart
                        className={`w-4 h-4 transition-colors ${
                            isFavourite ? 'fill-primary-foreground text-primary-foreground' : 'text-white'
                        }`}
                    />
                </button>
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="font-semibold text-sm text-foreground truncate leading-tight mb-1.5">
                    {channel.name}
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {channel.language && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground uppercase tracking-wide">
                            {channel.language}
                        </span>
                    )}
                    {channel.country && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground">
                            {channel.country}
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}
