import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Maximize2, Minimize2, Volume2, VolumeX, Loader2, AlertCircle, Star } from 'lucide-react';
import type { Channel } from '../backend';

// Declare Hls from CDN global
declare const Hls: {
    isSupported(): boolean;
    new (config?: object): HlsInstance;
    Events: {
        MANIFEST_PARSED: string;
        ERROR: string;
    };
    ErrorTypes: {
        NETWORK_ERROR: string;
        MEDIA_ERROR: string;
    };
};

interface HlsInstance {
    loadSource(url: string): void;
    attachMedia(media: HTMLVideoElement): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    destroy(): void;
    recoverMediaError(): void;
    startLoad(): void;
}

interface HlsErrorData {
    fatal?: boolean;
    type?: string;
}

interface VideoPlayerProps {
    channel: Channel;
    onClose: () => void;
    isFavourite?: boolean;
    onToggleFavourite?: (id: bigint) => void;
}

const OVERLAY_HIDE_DELAY = 3000;

export default function VideoPlayer({ channel, onClose, isFavourite = false, onToggleFavourite }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<HlsInstance | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [overlayVisible, setOverlayVisible] = useState(false);

    // ── HLS setup ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !channel.streamUrl) return;

        setIsLoading(true);
        setError(null);

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const isHlsUrl =
            channel.streamUrl.includes('.m3u8') ||
            channel.streamUrl.includes('m3u8') ||
            channel.streamUrl.includes('/hls/') ||
            channel.streamUrl.includes('playlist');

        if (typeof Hls !== 'undefined' && Hls.isSupported() && isHlsUrl) {
            const hls = new Hls({
                maxLoadingDelay: 4,
                maxRetryDelay: 8,
                maxMaxBufferLength: 30,
            });
            hlsRef.current = hls;

            hls.loadSource(channel.streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                video.play().catch(() => {
                    setIsLoading(false);
                });
            });

            hls.on(Hls.Events.ERROR, (...args: unknown[]) => {
                const data = args[1] as HlsErrorData | undefined;
                if (data?.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        setError('Network error — stream may be unavailable');
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        setError('Stream error — unable to play this channel');
                    }
                    setIsLoading(false);
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = channel.streamUrl;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                video.play().catch(() => setIsLoading(false));
            });
            video.addEventListener('error', () => {
                setError('Unable to play this stream');
                setIsLoading(false);
            });
        } else {
            video.src = channel.streamUrl;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                video.play().catch(() => setIsLoading(false));
            });
            video.addEventListener('error', () => {
                setError('Unable to play this stream');
                setIsLoading(false);
            });
        }

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

    // ── Controls ───────────────────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted((m) => !m);
        }
    }, []);

    const toggleFullscreen = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    }, []);

    const handleFavouriteToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavourite?.(channel.id);
        scheduleHide();
    }, [onToggleFavourite, channel.id, scheduleHide]);

    return (
        <div className="relative w-full bg-black rounded-xl overflow-hidden border border-border shadow-2xl">
            {/* Video container */}
            <div
                ref={containerRef}
                className="relative aspect-video bg-black"
                onClick={handleContainerInteraction}
                onMouseMove={handleContainerInteraction}
                onTouchStart={handleContainerInteraction}
            >
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    controls={!isFullscreen}
                    playsInline
                    muted={isMuted}
                />

                {/* Loading overlay */}
                {isLoading && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 pointer-events-none">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground font-medium">Loading stream…</p>
                    </div>
                )}

                {/* Error overlay */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3 p-6 pointer-events-none">
                        <AlertCircle className="w-10 h-10 text-destructive" />
                        <p className="text-sm text-center text-muted-foreground font-medium">{error}</p>
                        <p className="text-xs text-center text-muted-foreground/60">
                            The stream URL may be offline or geo-restricted.
                        </p>
                    </div>
                )}

                {/* Non-fullscreen: channel info overlay (top-left) */}
                {!isFullscreen && !isLoading && !error && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse-red flex-shrink-0" />
                        <span className="text-xs font-bold text-white tracking-wide uppercase">LIVE</span>
                        <span className="text-xs text-white/80 font-medium">{channel.name}</span>
                        {channel.country && (
                            <>
                                <span className="text-white/40">·</span>
                                <span className="text-xs text-white/60">{channel.country}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Non-fullscreen: custom controls overlay (top-right) */}
                {!isFullscreen && (
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                        {onToggleFavourite && (
                            <button
                                onClick={handleFavouriteToggle}
                                className={`w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                                    isFavourite
                                        ? 'bg-amber-500/30 hover:bg-amber-500/50 text-amber-400'
                                        : 'bg-black/60 hover:bg-black/80 text-white/80 hover:text-amber-400'
                                }`}
                                title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                            >
                                <Star className={`w-4 h-4 ${isFavourite ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                        )}
                        <button
                            onClick={toggleMute}
                            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? (
                                <VolumeX className="w-4 h-4 text-white" />
                            ) : (
                                <Volume2 className="w-4 h-4 text-white" />
                            )}
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                            title="Fullscreen"
                        >
                            <Maximize2 className="w-4 h-4 text-white" />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-primary/80 transition-colors"
                            title="Close player"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                )}

                {/* Fullscreen overlay */}
                {isFullscreen && (
                    <div
                        className={`absolute inset-0 transition-opacity duration-300 ${overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        {/* Top bar */}
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent px-5 pt-4 pb-8 flex items-center justify-between">
                            {/* Channel info */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse-red flex-shrink-0" />
                                    <span className="text-xs font-bold text-white tracking-wide uppercase">LIVE</span>
                                    <span className="text-sm text-white/90 font-semibold truncate">{channel.name}</span>
                                    {channel.country && (
                                        <>
                                            <span className="text-white/40">·</span>
                                            <span className="text-xs text-white/60">{channel.country}</span>
                                        </>
                                    )}
                                </div>
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
                                {/* Mute */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleMute(); scheduleHide(); }}
                                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5 text-white" />
                                    ) : (
                                        <Volume2 className="w-5 h-5 text-white" />
                                    )}
                                </button>
                                {/* Exit fullscreen */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); document.exitFullscreen(); }}
                                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                                    title="Exit fullscreen"
                                >
                                    <Minimize2 className="w-5 h-5 text-white" />
                                </button>
                                {/* Close */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); document.exitFullscreen().then(() => onClose()); }}
                                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-primary/70 transition-colors"
                                    title="Close player"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom gradient */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-20 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Channel info bar (non-fullscreen) */}
            <div className="px-4 py-3 bg-card flex items-center gap-3">
                {channel.thumbnailUrl ? (
                    <img
                        src={channel.thumbnailUrl}
                        alt={channel.name}
                        className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-muted"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/assets/generated/channel-placeholder.dim_320x180.png';
                        }}
                    />
                ) : (
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📺</span>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-bold text-foreground truncate">{channel.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {channel.language && <span>{channel.language}</span>}
                        {channel.language && channel.country && <span>·</span>}
                        {channel.country && <span>{channel.country}</span>}
                    </div>
                </div>
                {/* Favourite button in info bar */}
                {onToggleFavourite && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavourite(channel.id); }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                            isFavourite
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                                : 'bg-secondary hover:bg-muted text-muted-foreground hover:text-amber-400'
                        }`}
                        title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                    >
                        <Star className={`w-4 h-4 ${isFavourite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                )}
            </div>
        </div>
    );
}
