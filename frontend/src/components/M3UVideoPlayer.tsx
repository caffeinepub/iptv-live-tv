import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Tv2, Star, Maximize2, Minimize2 } from 'lucide-react';
import type { M3UChannel } from '../utils/m3uParser';

declare global {
    interface Window {
        Hls: {
            isSupported(): boolean;
            new(): HlsInstance;
            Events: { ERROR: string };
        };
    }
}

interface HlsInstance {
    loadSource(url: string): void;
    attachMedia(el: HTMLVideoElement): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    destroy(): void;
}

interface M3UVideoPlayerProps {
    channel: M3UChannel;
    onClose: () => void;
    isFavourite?: boolean;
    onToggleFavourite?: (id: string) => void;
}

const OVERLAY_HIDE_DELAY = 3000;

export default function M3UVideoPlayer({ channel, onClose, isFavourite = false, onToggleFavourite }: M3UVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<HlsInstance | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [overlayVisible, setOverlayVisible] = useState(false);

    // ── HLS setup ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const src = channel.streamUrl;

        if (window.Hls && window.Hls.isSupported()) {
            const hls = new window.Hls();
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.ERROR, (...args: unknown[]) => {
                const data = args[1] as { fatal?: boolean };
                if (data?.fatal) {
                    video.src = src;
                    video.load();
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
        } else {
            video.src = src;
        }

        video.play().catch(() => {});

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [channel.streamUrl]);

    // ── Fullscreen change listener ─────────────────────────────────────────────
    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            if (!document.fullscreenElement) {
                setOverlayVisible(false);
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            }
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // ── Overlay auto-hide logic ────────────────────────────────────────────────
    const scheduleHide = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            setOverlayVisible(false);
        }, OVERLAY_HIDE_DELAY);
    }, []);

    const showOverlay = useCallback(() => {
        setOverlayVisible(true);
        scheduleHide();
    }, [scheduleHide]);

    const handleContainerInteraction = useCallback(() => {
        if (isFullscreen) {
            showOverlay();
        }
    }, [isFullscreen, showOverlay]);

    // ── Fullscreen toggle ──────────────────────────────────────────────────────
    const toggleFullscreen = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    }, []);

    // ── Favourite toggle ───────────────────────────────────────────────────────
    const handleFavouriteToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavourite?.(channel.id);
        // Keep overlay visible after interaction
        scheduleHide();
    }, [onToggleFavourite, channel.id, scheduleHide]);

    return (
        <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-glow-red">
            {/* Header (non-fullscreen) */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-1.5 bg-primary/90 rounded-full px-2.5 py-1 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse-red" />
                        <span className="text-[10px] font-bold text-primary-foreground tracking-widest uppercase">Live</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                        <Tv2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <h2 className="font-semibold text-sm text-foreground truncate">{channel.name}</h2>
                    </div>
                    {channel.language && (
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground uppercase tracking-wide flex-shrink-0">
                            {channel.language}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {/* Favourite button (non-fullscreen header) */}
                    {onToggleFavourite && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavourite(channel.id); }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                isFavourite
                                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                                    : 'bg-secondary hover:bg-muted text-muted-foreground hover:text-amber-400'
                            }`}
                            title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                        >
                            <Star className={`w-4 h-4 ${isFavourite ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                    )}
                    <button
                        onClick={toggleFullscreen}
                        className="w-8 h-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
                        title="Fullscreen"
                    >
                        <Maximize2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
                        title="Close player"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            </div>

            {/* Video container */}
            <div
                ref={containerRef}
                className="relative bg-black aspect-video"
                onClick={handleContainerInteraction}
                onMouseMove={handleContainerInteraction}
                onTouchStart={handleContainerInteraction}
            >
                <video
                    ref={videoRef}
                    controls={!isFullscreen}
                    autoPlay
                    playsInline
                    className="w-full h-full"
                />

                {/* Fullscreen overlay */}
                {isFullscreen && (
                    <div
                        className={`absolute inset-0 transition-opacity duration-300 ${overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        {/* Top bar */}
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent px-5 pt-4 pb-8 flex items-center justify-between">
                            {/* Channel info */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex items-center gap-1.5 bg-primary/90 rounded-full px-2.5 py-1 flex-shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse-red" />
                                    <span className="text-[10px] font-bold text-primary-foreground tracking-widest uppercase">Live</span>
                                </div>
                                <span className="text-white font-semibold text-sm truncate">{channel.name}</span>
                                {channel.language && (
                                    <span className="text-white/60 text-xs">{channel.language}</span>
                                )}
                            </div>

                            {/* Top-right controls */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Star favourite button */}
                                {onToggleFavourite && (
                                    <button
                                        onClick={handleFavouriteToggle}
                                        className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                                            isFavourite
                                                ? 'bg-amber-500/30 hover:bg-amber-500/50 text-amber-400'
                                                : 'bg-black/50 hover:bg-black/70 text-white/80 hover:text-amber-400'
                                        }`}
                                        title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                                    >
                                        <Star className={`w-5 h-5 ${isFavourite ? 'fill-amber-400 text-amber-400' : ''}`} />
                                    </button>
                                )}
                                {/* Exit fullscreen */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); document.exitFullscreen(); }}
                                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                                    title="Exit fullscreen"
                                >
                                    <Minimize2 className="w-5 h-5 text-white" />
                                </button>
                                {/* Close player */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); document.exitFullscreen().then(() => onClose()); }}
                                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-primary/70 transition-colors"
                                    title="Close player"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom gradient for visual depth */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-20 pointer-events-none" />
                    </div>
                )}
            </div>
        </div>
    );
}
