import React from 'react';
import { Filter, X, Search } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FilterControlsProps {
    languages: string[];
    countries: string[];
    selectedLanguage: string;
    selectedCountry: string;
    onLanguageChange: (value: string) => void;
    onCountryChange: (value: string) => void;
    totalCount: number;
    filteredCount: number;
    searchQuery: string;
    onSearchChange: (value: string) => void;
}

export default function FilterControls({
    languages,
    countries,
    selectedLanguage,
    selectedCountry,
    onLanguageChange,
    onCountryChange,
    totalCount,
    filteredCount,
    searchQuery,
    onSearchChange,
}: FilterControlsProps) {
    const hasActiveFilters = selectedLanguage !== 'all' || selectedCountry !== 'all';

    const clearFilters = () => {
        onLanguageChange('all');
        onCountryChange('all');
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Search input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search channels by name…"
                    className="pl-9 pr-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:block">Filter:</span>
                </div>

                {/* Language filter */}
                <Select value={selectedLanguage} onValueChange={onLanguageChange}>
                    <SelectTrigger className="w-[150px] bg-secondary border-border text-foreground text-sm h-9">
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                        <SelectItem value="all" className="text-foreground">All Languages</SelectItem>
                        {languages.map((lang) => (
                            <SelectItem key={lang} value={lang} className="text-foreground">
                                {lang}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Country filter */}
                <Select value={selectedCountry} onValueChange={onCountryChange}>
                    <SelectTrigger className="w-[150px] bg-secondary border-border text-foreground text-sm h-9">
                        <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                        <SelectItem value="all" className="text-foreground">All Countries</SelectItem>
                        {countries.map((country) => (
                            <SelectItem key={country} value={country} className="text-foreground">
                                {country}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Clear filters */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-1.5 text-muted-foreground hover:text-foreground h-9 px-3"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear
                    </Button>
                )}

                {/* Count */}
                <span className="text-xs text-muted-foreground ml-auto">
                    {filteredCount === totalCount
                        ? `${totalCount} channels`
                        : `${filteredCount} of ${totalCount} channels`}
                </span>
            </div>
        </div>
    );
}
