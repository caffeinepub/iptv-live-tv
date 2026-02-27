import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Channel, Playlist, PlaylistId, ChannelId } from '../backend';

// ─── Channels ────────────────────────────────────────────────────────────────

export function useGetChannels() {
    const { actor, isFetching: actorFetching } = useActor();

    return useQuery<Channel[]>({
        queryKey: ['channels'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getChannels();
        },
        enabled: !!actor && !actorFetching,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

// ─── Favourites ───────────────────────────────────────────────────────────────

export function useGetFavourites() {
    const { actor, isFetching: actorFetching } = useActor();

    return useQuery<Channel[]>({
        queryKey: ['favourites'],
        queryFn: async () => {
            if (!actor) return [];
            try {
                return await actor.getFavourites();
            } catch {
                // Anonymous users can't access favourites
                return [];
            }
        },
        enabled: !!actor && !actorFetching,
        staleTime: 1000 * 60 * 2,
    });
}

export function useToggleFavourite() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (channelId: bigint) => {
            if (!actor) throw new Error('Actor not available');
            return actor.toggleFavourite(channelId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favourites'] });
        },
    });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
    const { actor, isFetching: actorFetching } = useActor();

    const query = useQuery({
        queryKey: ['currentUserProfile'],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            return actor.getCallerUserProfile();
        },
        enabled: !!actor && !actorFetching,
        retry: false,
    });

    return {
        ...query,
        isLoading: actorFetching || query.isLoading,
        isFetched: !!actor && query.isFetched,
    };
}

export function useSaveCallerUserProfile() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profile: { name: string }) => {
            if (!actor) throw new Error('Actor not available');
            return actor.saveCallerUserProfile(profile);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        },
    });
}

// ─── Playlists ────────────────────────────────────────────────────────────────

export function useGetMyPlaylists() {
    const { actor, isFetching: actorFetching } = useActor();

    return useQuery<Playlist[]>({
        queryKey: ['myPlaylists'],
        queryFn: async () => {
            if (!actor) return [];
            try {
                return await actor.getMyPlaylists();
            } catch {
                return [];
            }
        },
        enabled: !!actor && !actorFetching,
        staleTime: 1000 * 60 * 2,
    });
}

export function useCreatePlaylist() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (name: string) => {
            if (!actor) throw new Error('Actor not available');
            return actor.createPlaylist(name);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myPlaylists'] });
        },
    });
}

export function useDeletePlaylist() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (playlistId: PlaylistId) => {
            if (!actor) throw new Error('Actor not available');
            return actor.deletePlaylist(playlistId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myPlaylists'] });
        },
    });
}

export function useAddChannelToPlaylist() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playlistId, channelId }: { playlistId: PlaylistId; channelId: ChannelId }) => {
            if (!actor) throw new Error('Actor not available');
            return actor.addChannelToPlaylist(playlistId, channelId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myPlaylists'] });
        },
    });
}

export function useRemoveChannelFromPlaylist() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playlistId, channelId }: { playlistId: PlaylistId; channelId: ChannelId }) => {
            if (!actor) throw new Error('Actor not available');
            return actor.removeChannelFromPlaylist(playlistId, channelId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myPlaylists'] });
        },
    });
}
