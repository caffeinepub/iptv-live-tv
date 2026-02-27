import React, { useState } from 'react';
import { Tv2, LogIn, LogOut, User, Plus, X, Star } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile, useGetMyPlaylists, useDeletePlaylist } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreatePlaylistModal from './CreatePlaylistModal';
import type { PlaylistId } from '../backend';

type FilterMode = 'all' | 'favourites' | { playlistId: PlaylistId };

interface NavigationProps {
    activeFilter: FilterMode;
    onFilterChange: (filter: FilterMode) => void;
}

export default function Navigation({ activeFilter, onFilterChange }: NavigationProps) {
    const { login, clear, loginStatus, identity } = useInternetIdentity();
    const queryClient = useQueryClient();
    const { data: userProfile } = useGetCallerUserProfile();
    const { data: playlists = [] } = useGetMyPlaylists();
    const deletePlaylist = useDeletePlaylist();
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const isAuthenticated = !!identity;
    const isLoggingIn = loginStatus === 'logging-in';

    const handleAuth = async () => {
        if (isAuthenticated) {
            await clear();
            queryClient.clear();
        } else {
            try {
                await login();
            } catch (error: unknown) {
                const err = error as Error;
                if (err?.message === 'User is already authenticated') {
                    await clear();
                    setTimeout(() => login(), 300);
                }
            }
        }
    };

    const handleDeletePlaylist = async (e: React.MouseEvent, playlistId: PlaylistId) => {
        e.stopPropagation();
        // If the deleted playlist is currently active, reset to 'all'
        if (
            typeof activeFilter === 'object' &&
            'playlistId' in activeFilter &&
            activeFilter.playlistId === playlistId
        ) {
            onFilterChange('all');
        }
        deletePlaylist.mutate(playlistId);
    };

    const isFilterActive = (filter: FilterMode): boolean => {
        if (filter === 'all' && activeFilter === 'all') return true;
        if (filter === 'favourites' && activeFilter === 'favourites') return true;
        if (
            typeof filter === 'object' &&
            typeof activeFilter === 'object' &&
            'playlistId' in filter &&
            'playlistId' in activeFilter &&
            filter.playlistId === activeFilter.playlistId
        ) return true;
        return false;
    };

    const tabClass = (active: boolean) =>
        `px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
            active
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
        }`;

    const favouritesActive = isFilterActive('favourites');

    return (
        <>
            <header className="sticky top-0 z-50 nav-blur bg-background/80 border-b border-border">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">
                        {/* Logo */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <img
                                src="/assets/generated/streamvault-logo.dim_200x60.png"
                                alt="StreamVault"
                                className="h-9 w-auto object-contain"
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const sibling = target.nextElementSibling as HTMLElement;
                                    if (sibling) sibling.style.display = 'flex';
                                }}
                            />
                            <div className="hidden items-center gap-2">
                                <Tv2 className="w-7 h-7 text-primary" />
                                <span className="font-display text-2xl font-bold text-gradient-red tracking-wide">
                                    StreamVault
                                </span>
                            </div>
                        </div>

                        {/* Filter Tabs — scrollable on small screens */}
                        <nav className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                            <div className="flex items-center gap-1 bg-secondary/50 rounded-full px-1.5 py-1.5 w-max min-w-full">
                                {/* All Channels */}
                                <button
                                    onClick={() => onFilterChange('all')}
                                    className={tabClass(isFilterActive('all'))}
                                >
                                    All Channels
                                </button>

                                {/* Favourites */}
                                <button
                                    onClick={() => onFilterChange('favourites')}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                                        favouritesActive
                                            ? 'bg-primary text-primary-foreground shadow-md'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Star
                                        className={`w-3.5 h-3.5 transition-colors ${
                                            favouritesActive ? 'fill-primary-foreground text-primary-foreground' : 'fill-none'
                                        }`}
                                    />
                                    Favourites
                                </button>

                                {/* Playlist tabs — authenticated only */}
                                {isAuthenticated && playlists.map((playlist) => (
                                    <div key={playlist.id.toString()} className="flex items-center gap-0.5">
                                        <button
                                            onClick={() => onFilterChange({ playlistId: playlist.id })}
                                            className={tabClass(isFilterActive({ playlistId: playlist.id }))}
                                        >
                                            {playlist.name}
                                        </button>
                                        <button
                                            onClick={(e) => handleDeletePlaylist(e, playlist.id)}
                                            disabled={deletePlaylist.isPending}
                                            className="w-5 h-5 rounded-full flex items-center justify-center
                                                text-muted-foreground hover:text-destructive hover:bg-destructive/10
                                                transition-colors duration-150 flex-shrink-0"
                                            title={`Delete "${playlist.name}"`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* New Playlist button — authenticated only */}
                                {isAuthenticated && (
                                    <button
                                        onClick={() => setCreateModalOpen(true)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold
                                            text-muted-foreground hover:text-foreground hover:bg-secondary
                                            transition-all duration-200 flex-shrink-0 border border-dashed border-border/60
                                            hover:border-primary/40"
                                        title="Create new playlist"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">New Playlist</span>
                                    </button>
                                )}
                            </div>
                        </nav>

                        {/* Auth */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="gap-2 text-foreground hover:bg-secondary">
                                            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                                                <User className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                                                {userProfile?.name ?? 'Account'}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-popover border-border">
                                        <DropdownMenuItem
                                            onClick={handleAuth}
                                            className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    onClick={handleAuth}
                                    disabled={isLoggingIn}
                                    size="sm"
                                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                >
                                    <LogIn className="w-4 h-4" />
                                    {isLoggingIn ? 'Signing in…' : 'Sign In'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <CreatePlaylistModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
            />
        </>
    );
}
