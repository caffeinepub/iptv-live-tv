import React, { useState } from 'react';
import { User } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';

interface ProfileSetupModalProps {
    open: boolean;
    onComplete: () => void;
}

export default function ProfileSetupModal({ open, onComplete }: ProfileSetupModalProps) {
    const [name, setName] = useState('');
    const saveProfile = useSaveCallerUserProfile();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        await saveProfile.mutateAsync({ name: name.trim() });
        onComplete();
    };

    return (
        <Dialog open={open}>
            <DialogContent className="bg-card border-border sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <DialogTitle className="font-display text-xl text-foreground">Welcome to StreamVault</DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground">
                        Set up your display name to personalize your experience and save favourites.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground font-medium">Display Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name…"
                            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            autoFocus
                            maxLength={50}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={!name.trim() || saveProfile.isPending}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                        {saveProfile.isPending ? 'Saving…' : 'Get Started'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
