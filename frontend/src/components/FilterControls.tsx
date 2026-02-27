import React from 'react';
import { Filter, X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface FilterControlsProps {
    languages: string[];
    countries: string[];
    selectedLanguage: string;
    selectedCountry: string;
    onLanguageChange: (value: string) => void;
    onCountryChange: (value: string) => void;
    totalCount: number;
    filteredCount: number;
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
}: FilterControlsProps) {
    const hasActiveFilters = selectedLanguage !== 'all' || selectedCountry !== 'all';

    const clearFilters = () => {
        onLanguageChange('all');
        onCountryChange('all');
    };

    return (
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
    );
}
