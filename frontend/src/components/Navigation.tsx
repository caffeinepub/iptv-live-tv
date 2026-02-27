import React from 'react';
import { Tv2, LogIn, LogOut, User } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavigationProps {
    activeFilter: 'all' | 'favourites';
    onFilterChange: (filter: 'all' | 'favourites') => void;
}

export default function Navigation({ activeFilter, onFilterChange }: NavigationProps) {
    const { login, clear, loginStatus, identity } = useInternetIdentity();
    const queryClient = useQueryClient();
    const { data: userProfile } = useGetCallerUserProfile();

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

    return (
        <header className="sticky top-0 z-50 nav-blur bg-background/80 border-b border-border">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
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

                    {/* Filter Tabs */}
                    <nav className="flex items-center gap-1 bg-secondary/50 rounded-full px-1.5 py-1.5">
                        <button
                            onClick={() => onFilterChange('all')}
                            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                                activeFilter === 'all'
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            All Channels
                        </button>
                        <button
                            onClick={() => onFilterChange('favourites')}
                            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                                activeFilter === 'favourites'
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            ❤ Favourites
                        </button>
                    </nav>

                    {/* Auth */}
                    <div className="flex items-center gap-3">
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
    );
}
