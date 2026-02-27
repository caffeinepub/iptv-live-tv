import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
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
}

export default function VideoPlayer({ channel, onClose }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<HlsInstance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !channel.streamUrl) return;

        setIsLoading(true);
        setError(null);

        // Cleanup previous instance
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
                    // Autoplay blocked, user can click play
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
            // Native HLS (Safari)
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
            // Try direct playback for non-HLS streams
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

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        const container = videoRef.current?.parentElement?.parentElement;
        if (container) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                container.requestFullscreen();
            }
        }
    };

    return (
        <div className="relative w-full bg-black rounded-xl overflow-hidden border border-border shadow-2xl">
            {/* Video */}
            <div className="relative aspect-video bg-black">
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                    muted={isMuted}
                />

                {/* Loading overlay */}
                {isLoading && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground font-medium">Loading stream…</p>
                    </div>
                )}

                {/* Error overlay */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3 p-6">
                        <AlertCircle className="w-10 h-10 text-destructive" />
                        <p className="text-sm text-center text-muted-foreground font-medium">{error}</p>
                        <p className="text-xs text-center text-muted-foreground/60">
                            The stream URL may be offline or geo-restricted.
                        </p>
                    </div>
                )}

                {/* Channel info overlay (top-left) */}
                {!isLoading && !error && (
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

                {/* Custom controls overlay (top-right) */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
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
            </div>

            {/* Channel info bar */}
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
            </div>
        </div>
    );
}
