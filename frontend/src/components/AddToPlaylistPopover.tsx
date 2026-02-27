import React from 'react';
import { ListPlus, Check, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    useGetMyPlaylists,
    useAddChannelToPlaylist,
    useRemoveChannelFromPlaylist,
} from '../hooks/useQueries';
import type { ChannelId } from '../backend';

interface AddToPlaylistPopoverProps {
    channelId: ChannelId;
}

export default function AddToPlaylistPopover({ channelId }: AddToPlaylistPopoverProps) {
    const { data: playlists = [], isLoading } = useGetMyPlaylists();
    const addToPlaylist = useAddChannelToPlaylist();
    const removeFromPlaylist = useRemoveChannelFromPlaylist();

    const isPendingFor = (playlistId: bigint) =>
        (addToPlaylist.isPending && addToPlaylist.variables?.playlistId === playlistId) ||
        (removeFromPlaylist.isPending && removeFromPlaylist.variables?.playlistId === playlistId);

    const handleToggle = (e: React.MouseEvent, playlistId: bigint, isInPlaylist: boolean) => {
        e.stopPropagation();
        if (isInPlaylist) {
            removeFromPlaylist.mutate({ playlistId, channelId });
        } else {
            addToPlaylist.mutate({ playlistId, channelId });
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center
                        transition-all duration-200 bg-black/50 hover:bg-black/70
                        opacity-0 group-hover:opacity-100"
                    title="Add to playlist"
                >
                    <ListPlus className="w-4 h-4 text-white" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-56 p-0 bg-popover border-border shadow-xl"
                align="end"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Add to Playlist
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                ) : playlists.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                        <p className="text-xs text-muted-foreground">No playlists yet.</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Create one from the nav bar.</p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-48">
                        <div className="py-1">
                            {playlists.map((playlist) => {
                                const isInPlaylist = playlist.channels.some((id) => id === channelId);
                                const pending = isPendingFor(playlist.id);

                                return (
                                    <Button
                                        key={playlist.id.toString()}
                                        variant="ghost"
                                        size="sm"
                                        disabled={pending}
                                        onClick={(e) => handleToggle(e, playlist.id, isInPlaylist)}
                                        className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none
                                            text-foreground hover:bg-secondary font-normal text-sm"
                                    >
                                        <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0
                                            border transition-colors
                                            ${isInPlaylist
                                                ? 'bg-secondary-accent border-secondary-accent'
                                                : 'border-border bg-transparent'
                                            }`}
                                        >
                                            {pending ? (
                                                <Loader2 className="w-2.5 h-2.5 animate-spin text-muted-foreground" />
                                            ) : isInPlaylist ? (
                                                <Check className="w-2.5 h-2.5 text-secondary-accent-foreground" />
                                            ) : null}
                                        </span>
                                        <span className="truncate">{playlist.name}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}
            </PopoverContent>
        </Popover>
    );
}
