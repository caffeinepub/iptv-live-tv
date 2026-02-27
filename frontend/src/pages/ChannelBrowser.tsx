import React, { useState, useMemo } from 'react';
import { Tv2 } from 'lucide-react';
import Navigation from '../components/Navigation';
import ChannelGrid from '../components/ChannelGrid';
import FilterControls from '../components/FilterControls';
import VideoPlayer from '../components/VideoPlayer';
import ProfileSetupModal from '../components/ProfileSetupModal';
import { useGetChannels, useGetFavourites, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { Channel } from '../backend';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChannelBrowser() {
    const { identity } = useInternetIdentity();
    const isAuthenticated = !!identity;

    // Data
    const { data: channels = [], isLoading: channelsLoading } = useGetChannels();
    const { data: favouriteChannels = [] } = useGetFavourites();
    const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();

    // UI state
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'favourites'>('all');
    const [selectedLanguage, setSelectedLanguage] = useState('all');
    const [selectedCountry, setSelectedCountry] = useState('all');

    // Profile setup modal
    const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;

    // Favourite IDs set for O(1) lookup
    const favouriteIds = useMemo(
        () => new Set(favouriteChannels.map((c) => c.id.toString())),
        [favouriteChannels]
    );

    // Unique filter options
    const languages = useMemo(() => {
        const langs = new Set(channels.map((c) => c.language).filter(Boolean));
        return Array.from(langs).sort();
    }, [channels]);

    const countries = useMemo(() => {
        const ctrs = new Set(channels.map((c) => c.country).filter(Boolean));
        return Array.from(ctrs).sort();
    }, [channels]);

    // Filtered channels
    const filteredChannels = useMemo(() => {
        let result = channels;

        // Favourites filter
        if (activeFilter === 'favourites') {
            result = result.filter((c) => favouriteIds.has(c.id.toString()));
        }

        // Language filter
        if (selectedLanguage !== 'all') {
            result = result.filter((c) => c.language === selectedLanguage);
        }

        // Country filter
        if (selectedCountry !== 'all') {
            result = result.filter((c) => c.country === selectedCountry);
        }

        return result;
    }, [channels, activeFilter, selectedLanguage, selectedCountry, favouriteIds]);

    const handleSelectChannel = (channel: Channel) => {
        setSelectedChannel((prev) => (prev?.id === channel.id ? null : channel));
    };

    const handleFilterChange = (filter: 'all' | 'favourites') => {
        setActiveFilter(filter);
        // Reset language/country filters when switching to favourites
        if (filter === 'favourites') {
            setSelectedLanguage('all');
            setSelectedCountry('all');
        }
    };

    const emptyMessage =
        activeFilter === 'favourites'
            ? isAuthenticated
                ? 'No favourites yet'
                : 'Sign in to save favourites'
            : 'No channels found';

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navigation */}
            <Navigation activeFilter={activeFilter} onFilterChange={handleFilterChange} />

            {/* Main content */}
            <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
                {/* Video Player */}
                {selectedChannel && (
                    <section className="mb-8">
                        <div className="max-w-4xl mx-auto">
                            <VideoPlayer
                                channel={selectedChannel}
                                onClose={() => setSelectedChannel(null)}
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
                        totalCount={
                            activeFilter === 'favourites'
                                ? favouriteChannels.length
                                : channels.length
                        }
                        filteredCount={filteredChannels.length}
                    />
                </section>

                {/* Channel Grid */}
                <section>
                    <ChannelGrid
                        channels={filteredChannels}
                        favouriteIds={favouriteIds}
                        selectedChannel={selectedChannel}
                        onSelectChannel={handleSelectChannel}
                        isLoading={channelsLoading}
                        emptyMessage={emptyMessage}
                    />
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border mt-auto">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Tv2 className="w-4 h-4 text-primary" />
                            <span className="font-display font-bold text-foreground">StreamVault</span>
                            <span>— Live TV via IPTV</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>© {new Date().getFullYear()} · Built with</span>
                            <span className="text-primary">♥</span>
                            <span>using</span>
                            <a
                                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'streamvault-iptv')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 font-semibold transition-colors"
                            >
                                caffeine.ai
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Profile Setup Modal */}
            <ProfileSetupModal
                open={showProfileSetup}
                onComplete={() => {}}
            />
        </div>
    );
}
