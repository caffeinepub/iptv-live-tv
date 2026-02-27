import React, { useState, useMemo, useRef } from 'react';
import { RefreshCw, AlertCircle, Link, PlusCircle, Star } from 'lucide-react';
import Navigation from '../components/Navigation';
import M3UChannelGrid from '../components/M3UChannelGrid';
import FilterControls from '../components/FilterControls';
import M3UVideoPlayer from '../components/M3UVideoPlayer';
import ProfileSetupModal from '../components/ProfileSetupModal';
import AddChannelModal from '../components/AddChannelModal';
import { useGetCallerUserProfile, useGetMyPlaylists } from '../hooks/useQueries';
import { useM3UChannels } from '../hooks/useM3UChannels';
import { useLocalFavourites } from '../hooks/useLocalFavourites';
import { useManualChannels } from '../hooks/useManualChannels';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { M3UChannel } from '../utils/m3uParser';
import type { PlaylistId } from '../backend';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DEFAULT_URL = 'https://iptv-org.github.io/iptv/index.m3u';

type FilterMode = 'all' | 'favourites' | { playlistId: PlaylistId };

export default function ChannelBrowser() {
    const { identity } = useInternetIdentity();
    const isAuthenticated = !!identity;

    // M3U URL state
    const [m3uUrl, setM3uUrl] = useState(DEFAULT_URL);
    const [activeUrl, setActiveUrl] = useState(DEFAULT_URL);
    const inputRef = useRef<HTMLInputElement>(null);

    // M3U channels
    const { data: m3uChannels = [], isLoading: channelsLoading, error: channelsError } = useM3UChannels(activeUrl);

    // Manually added channels
    const { manualChannels, addChannel } = useManualChannels();

    // Merge manual + M3U channels (manual first so they appear at the top)
    const channels = useMemo<M3UChannel[]>(() => [...manualChannels, ...m3uChannels], [manualChannels, m3uChannels]);

    // Local favourites (localStorage) — used for all users (M3U/guest and authenticated)
    const { favouriteIds, toggleFavourite, isFavourite } = useLocalFavourites();

    // User profile
    const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();

    // Playlists
    const { data: playlists = [] } = useGetMyPlaylists();

    // UI state
    const [selectedChannel, setSelectedChannel] = useState<M3UChannel | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterMode>('all');
    const [selectedLanguage, setSelectedLanguage] = useState('all');
    const [selectedCountry, setSelectedCountry] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [addModalOpen, setAddModalOpen] = useState(false);

    // Profile setup modal
    const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;

    // Unique filter options derived from all channels
    const languages = useMemo(() => {
        const langs = new Set(channels.map((c) => c.language).filter(Boolean));
        return Array.from(langs).sort();
    }, [channels]);

    const countries = useMemo(() => {
        const ctrs = new Set(channels.map((c) => c.country).filter(Boolean));
        return Array.from(ctrs).sort();
    }, [channels]);

    // Resolve playlist channel IDs for the active playlist filter
    const activePlaylistChannelIds = useMemo<Set<string> | null>(() => {
        if (typeof activeFilter !== 'object' || !('playlistId' in activeFilter)) return null;
        const playlist = playlists.find((p) => p.id === activeFilter.playlistId);
        if (!playlist) return new Set();
        return new Set(playlist.channels.map((id) => id.toString()));
    }, [activeFilter, playlists]);

    // Filtered channels (favourites + playlist + language + country + search)
    const filteredChannels = useMemo(() => {
        let result = channels;

        if (activeFilter === 'favourites') {
            // Filter to only channels that are in the local favourites set
            result = result.filter((c) => favouriteIds.has(c.id));
        } else if (activePlaylistChannelIds !== null) {
            result = result.filter((c) => {
                const numericId = c.id.replace(/^channel-/, '');
                return activePlaylistChannelIds.has(numericId) || activePlaylistChannelIds.has(c.id);
            });
        }

        if (selectedLanguage !== 'all') {
            result = result.filter((c) => c.language === selectedLanguage);
        }

        if (selectedCountry !== 'all') {
            result = result.filter((c) => c.country === selectedCountry);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter((c) => c.name.toLowerCase().includes(query));
        }

        return result;
    }, [channels, activeFilter, activePlaylistChannelIds, selectedLanguage, selectedCountry, searchQuery, favouriteIds]);

    const handleSelectChannel = (channel: M3UChannel) => {
        setSelectedChannel((prev) => (prev?.id === channel.id ? null : channel));
    };

    const handleFilterChange = (filter: FilterMode) => {
        setActiveFilter(filter);
        if (filter !== 'all') {
            setSelectedLanguage('all');
            setSelectedCountry('all');
        }
    };

    // When a favourite is toggled while in favourites view, deselect the channel if it's being removed
    const handleToggleFavourite = (id: string) => {
        const wasSelected = selectedChannel?.id === id;
        const willBeRemoved = favouriteIds.has(id);
        toggleFavourite(id);
        if (activeFilter === 'favourites' && wasSelected && willBeRemoved) {
            setSelectedChannel(null);
        }
    };

    const handleLoadUrl = () => {
        const trimmed = m3uUrl.trim();
        if (trimmed) {
            setActiveUrl(trimmed);
            setSelectedChannel(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleLoadUrl();
    };

    const activePlaylistName = useMemo(() => {
        if (typeof activeFilter !== 'object' || !('playlistId' in activeFilter)) return null;
        return playlists.find((p) => p.id === activeFilter.playlistId)?.name ?? null;
    }, [activeFilter, playlists]);

    const favouriteCount = channels.filter((c) => favouriteIds.has(c.id)).length;

    const emptyMessage =
        activeFilter === 'favourites'
            ? 'No favourites yet — star a channel to save it here'
            : activePlaylistName !== null
            ? `No channels in "${activePlaylistName}" yet — add channels using the playlist icon on each card`
            : searchQuery.trim()
            ? `No channels match "${searchQuery}"`
            : 'No channels found';

    const totalCount =
        activeFilter === 'favourites'
            ? favouriteCount
            : activePlaylistChannelIds !== null
            ? filteredChannels.length
            : channels.length;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navigation */}
            <Navigation activeFilter={activeFilter} onFilterChange={handleFilterChange} />

            {/* Main content */}
            <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

                {/* M3U URL Input + Add Channel button */}
                <section className="mb-6">
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                            <Link className="w-4 h-4" />
                            <span className="text-sm font-medium hidden sm:block">Playlist URL:</span>
                        </div>
                        <div className="flex flex-1 gap-2">
                            <Input
                                ref={inputRef}
                                value={m3uUrl}
                                onChange={(e) => setM3uUrl(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter M3U playlist URL…"
                                className="flex-1 bg-secondary border-border text-foreground text-sm h-9 font-mono"
                            />
                            <Button
                                onClick={handleLoadUrl}
                                disabled={channelsLoading}
                                size="sm"
                                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 flex-shrink-0"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${channelsLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">{channelsLoading ? 'Loading…' : 'Load'}</span>
                            </Button>
                            <Button
                                onClick={() => setAddModalOpen(true)}
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary h-9 px-4 flex-shrink-0"
                            >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Add Channel</span>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Error state */}
                {channelsError && (
                    <section className="mb-6">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-sm">Failed to load playlist</p>
                                <p className="text-xs mt-0.5 opacity-80">
                                    {(channelsError as Error).message || 'Network error. Check the URL and try again.'}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Favourites banner — shown when in favourites view */}
                {activeFilter === 'favourites' && (
                    <section className="mb-6">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/60 border border-border">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                            <p className="text-sm text-foreground font-medium">
                                {favouriteCount === 0
                                    ? 'No favourites saved yet'
                                    : `${favouriteCount} saved favourite${favouriteCount !== 1 ? 's' : ''}`}
                            </p>
                            {favouriteCount > 0 && searchQuery.trim() && filteredChannels.length !== favouriteCount && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                    Showing {filteredChannels.length} of {favouriteCount} matching filters
                                </span>
                            )}
                        </div>
                    </section>
                )}

                {/* Video Player */}
                {selectedChannel && (
                    <section className="mb-8">
                        <div className="max-w-4xl mx-auto">
                            <M3UVideoPlayer
                                channel={selectedChannel}
                                onClose={() => setSelectedChannel(null)}
                                isFavourite={isFavourite(selectedChannel.id)}
                                onToggleFavourite={handleToggleFavourite}
                            />
                        </div>
                    </section>
                )}

                {/* Filter Controls */}
                <section className="mb-6">
                    <FilterControls
                        languages={languages}
                        countries={countries}
                        selectedLanguage={selectedLanguage}
                        selectedCountry={selectedCountry}
                        onLanguageChange={setSelectedLanguage}
                        onCountryChange={setSelectedCountry}
                        totalCount={totalCount}
                        filteredCount={filteredChannels.length}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                </section>

                {/* Channel Grid */}
                <section>
                    <M3UChannelGrid
                        channels={filteredChannels}
                        isLoading={channelsLoading}
                        selectedChannel={selectedChannel}
                        onSelectChannel={handleSelectChannel}
                        favouriteIds={favouriteIds}
                        onToggleFavourite={handleToggleFavourite}
                        emptyMessage={emptyMessage}
                    />
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-6 mt-8">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
                    <p>
                        © {new Date().getFullYear()} StreamVault · Built with{' '}
                        <span className="text-primary">♥</span> using{' '}
                        <a
                            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'streamvault')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            caffeine.ai
                        </a>
                    </p>
                </div>
            </footer>

            {/* Modals */}
            <ProfileSetupModal open={showProfileSetup} onComplete={() => {}} />
            <AddChannelModal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onAdd={addChannel}
            />
        </div>
    );
}
