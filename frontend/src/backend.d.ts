import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addChannel(name: string, streamUrl: string, language: string, country: string, thumbnailUrl: string): Promise<ChannelId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteChannel(id: ChannelId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChannels(): Promise<Array<Channel>>;
    getFavourites(): Promise<Array<Channel>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleFavourite(channelId: ChannelId): Promise<boolean>;
    updateChannel(id: ChannelId, name: string, streamUrl: string, language: string, country: string, thumbnailUrl: string): Promise<void>;
}
