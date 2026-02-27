import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ManualChannelInput } from '../hooks/useManualChannels';

interface AddChannelModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: ManualChannelInput) => void;
}

const EMPTY_FORM: ManualChannelInput = {
  name: '',
  streamUrl: '',
  thumbnailUrl: '',
  language: '',
  country: '',
};

export default function AddChannelModal({ open, onClose, onAdd }: AddChannelModalProps) {
  const [form, setForm] = useState<ManualChannelInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<{ name?: string; streamUrl?: string }>({});

  const handleChange = (field: keyof ManualChannelInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { name?: string; streamUrl?: string } = {};
    if (!form.name.trim()) newErrors.name = 'Channel name is required.';
    if (!form.streamUrl.trim()) {
      newErrors.streamUrl = 'Stream URL is required.';
    } else {
      try {
        new URL(form.streamUrl.trim());
      } catch {
        newErrors.streamUrl = 'Please enter a valid URL.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onAdd(form);
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <PlusCircle className="w-5 h-5 text-primary" />
            Add IPTV Channel
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the details for your IPTV stream. Name and stream URL are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Channel Name */}
          <div className="space-y-1.5">
            <Label htmlFor="channel-name" className="text-sm font-medium text-foreground">
              Channel Name <span className="text-primary">*</span>
            </Label>
            <Input
              id="channel-name"
              value={form.name}
              onChange={handleChange('name')}
              placeholder="e.g. BBC News"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Stream URL */}
          <div className="space-y-1.5">
            <Label htmlFor="stream-url" className="text-sm font-medium text-foreground">
              Stream URL <span className="text-primary">*</span>
            </Label>
            <Input
              id="stream-url"
              value={form.streamUrl}
              onChange={handleChange('streamUrl')}
              placeholder="https://example.com/stream.m3u8"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
            />
            {errors.streamUrl && (
              <p className="text-xs text-destructive">{errors.streamUrl}</p>
            )}
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5">
            <Label htmlFor="logo-url" className="text-sm font-medium text-foreground">
              Logo URL <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Input
              id="logo-url"
              value={form.thumbnailUrl}
              onChange={handleChange('thumbnailUrl')}
              placeholder="https://example.com/logo.png"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
            />
          </div>

          {/* Language & Country row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="language" className="text-sm font-medium text-foreground">
                Language <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input
                id="language"
                value={form.language}
                onChange={handleChange('language')}
                placeholder="e.g. English"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-sm font-medium text-foreground">
                Country <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input
                id="country"
                value={form.country}
                onChange={handleChange('country')}
                placeholder="e.g. GB"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-border text-foreground hover:bg-secondary"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
