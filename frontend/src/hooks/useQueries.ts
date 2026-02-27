import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Channel } from '../backend';

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
