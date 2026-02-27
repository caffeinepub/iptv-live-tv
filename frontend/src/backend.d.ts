import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Playlist {
    id: PlaylistId;
    owner: Principal;
    name: string;
    channels: Array<ChannelId>;
}
export interface Channel {
    id: ChannelId;
    country: string;
    thumbnailUrl: string;
    name: string;
    language: string;
    streamUrl: string;
}
export type ChannelId = bigint;
export interface UserProfile {
    name: string;
}
export type PlaylistId = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addChannel(name: string, streamUrl: string, language: string, country: string, thumbnailUrl: string): Promise<ChannelId>;
    addChannelToPlaylist(playlistId: PlaylistId, channelId: ChannelId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPlaylist(name: string): Promise<PlaylistId>;
    deleteChannel(id: ChannelId): Promise<void>;
    deletePlaylist(playlistId: PlaylistId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChannels(): Promise<Array<Channel>>;
    getFavourites(): Promise<Array<Channel>>;
    getMyPlaylists(): Promise<Array<Playlist>>;
    getPlaylist(playlistId: PlaylistId): Promise<Playlist>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeChannelFromPlaylist(playlistId: PlaylistId, channelId: ChannelId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleFavourite(channelId: ChannelId): Promise<boolean>;
    updateChannel(id: ChannelId, name: string, streamUrl: string, language: string, country: string, thumbnailUrl: string): Promise<void>;
}
