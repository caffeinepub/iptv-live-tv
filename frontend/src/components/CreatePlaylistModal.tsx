import React, { useState } from 'react';
import { ListPlus, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCreatePlaylist } from '../hooks/useQueries';

interface CreatePlaylistModalProps {
    open: boolean;
    onClose: () => void;
}

export default function CreatePlaylistModal({ open, onClose }: CreatePlaylistModalProps) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const createPlaylist = useCreatePlaylist();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Playlist name is required.');
            return;
        }
        setError('');
        try {
            await createPlaylist.mutateAsync(trimmed);
            setName('');
            onClose();
        } catch {
            setError('Failed to create playlist. Please try again.');
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setName('');
            setError('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-popover border-border text-foreground sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <ListPlus className="w-5 h-5 text-primary" />
                        New Playlist
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Give your playlist a name to get started.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="playlist-name" className="text-sm font-medium text-foreground">
                            Playlist Name
                        </Label>
                        <Input
                            id="playlist-name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="e.g. Sports, News, Kids…"
                            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                            autoFocus
                            maxLength={80}
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                    </div>

                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleOpenChange(false)}
                            disabled={createPlaylist.isPending}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createPlaylist.isPending || !name.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                        >
                            {createPlaylist.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Playlist
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
