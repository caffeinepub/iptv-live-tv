import Map "mo:core/Map";
import Array "mo:core/Array";
import Set "mo:core/Set";
import List "mo:core/List";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type ChannelId = Nat;
  type PlaylistId = Nat;

  public type Channel = {
    id : ChannelId;
    name : Text;
    streamUrl : Text;
    language : Text;
    country : Text;
    thumbnailUrl : Text;
  };

  public type Playlist = {
    id : PlaylistId;
    owner : Principal;
    name : Text;
    channels : [ChannelId];
  };

  public type UserProfile = {
    name : Text;
  };

  // Actor state
  let channelStore = Map.empty<ChannelId, Channel>();
  var channelCounter = 0;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let favouriteChannels = Map.empty<Principal, Set.Set<ChannelId>>();

  let playlistStore = Map.empty<PlaylistId, Playlist>();
  var playlistCounter : PlaylistId = 0;
  let userPlaylists = Map.empty<Principal, List.List<PlaylistId>>();

  // Sorting helper
  module Channel {
    public func compareByName(channel1 : Channel, channel2 : Channel) : Order.Order {
      Text.compare(channel1.name, channel2.name);
    };
  };

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Channel management
  public shared ({ caller }) func addChannel(name : Text, streamUrl : Text, language : Text, country : Text, thumbnailUrl : Text) : async ChannelId {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add channels");
    };

    let newChannel : Channel = {
      id = channelCounter;
      name;
      streamUrl;
      language;
      country;
      thumbnailUrl;
    };

    channelStore.add(channelCounter, newChannel);
    channelCounter += 1;
    newChannel.id;
  };

  public shared ({ caller }) func updateChannel(id : ChannelId, name : Text, streamUrl : Text, language : Text, country : Text, thumbnailUrl : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update channels");
    };

    if (not channelStore.containsKey(id)) {
      Runtime.trap("Cannot update channel. Channel with id " # id.toText() # " does not exist");
    };
    let updatedChannel : Channel = {
      id;
      name;
      streamUrl;
      language;
      country;
      thumbnailUrl;
    };
    channelStore.add(id, updatedChannel);
  };

  public shared ({ caller }) func deleteChannel(id : ChannelId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete channels");
    };
    channelStore.remove(id);
  };

  public query func getChannels() : async [Channel] {
    channelStore.values().toArray().sort(Channel.compareByName);
  };

  // Favourites management
  public shared ({ caller }) func toggleFavourite(channelId : ChannelId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can manage favourites");
    };

    if (not channelStore.containsKey(channelId)) {
      Runtime.trap("Cannot add Favourite! Channel with id " # channelId.toText() # " does not exist");
    };

    let userFavourites = switch (favouriteChannels.get(caller)) {
      case (null) { Set.empty<ChannelId>() };
      case (?existing) { existing };
    };

    if (userFavourites.contains(channelId)) {
      userFavourites.remove(channelId);
      favouriteChannels.add(caller, userFavourites);
      false;
    } else {
      userFavourites.add(channelId);
      favouriteChannels.add(caller, userFavourites);
      true;
    };
  };

  public query ({ caller }) func getFavourites() : async [Channel] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view favourites");
    };

    let userFavourites = switch (favouriteChannels.get(caller)) {
      case (null) { Set.empty<ChannelId>() };
      case (?existing) { existing };
    };

    let channelIter = userFavourites.values().flatMap(
      func(id) {
        switch (channelStore.get(id)) {
          case (null) { [].values() };
          case (?channel) { [channel].values() };
        };
      }
    );
    channelIter.toArray().sort(Channel.compareByName);
  };

  // Playlist Management
  public shared ({ caller }) func createPlaylist(name : Text) : async PlaylistId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let newId = playlistCounter;

    let newPlaylist : Playlist = {
      id = newId;
      owner = caller;
      name;
      channels = [];
    };

    playlistStore.add(newId, newPlaylist);
    playlistCounter += 1;

    let currentPlaylists = switch (userPlaylists.get(caller)) {
      case (null) {
        let newList = List.empty<PlaylistId>();
        newList.add(newId);
        newList;
      };
      case (?existing) {
        existing.add(newId);
        existing;
      };
    };
    userPlaylists.add(caller, currentPlaylists);
    newId;
  };

  public shared ({ caller }) func deletePlaylist(playlistId : PlaylistId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let playlist = getPlaylistInternal(playlistId);

    if (playlist.owner != caller) {
      Runtime.trap("Unauthorized: Only the owner can delete this playlist");
    };

    playlistStore.remove(playlistId);
    let currentPlaylists = switch (userPlaylists.get(caller)) {
      case (null) { List.empty<PlaylistId>() };
      case (?existing) {
        let filtered = existing.filter(func(id) { id != playlistId });
        filtered;
      };
    };
    userPlaylists.add(caller, currentPlaylists);
  };

  public shared ({ caller }) func addChannelToPlaylist(playlistId : PlaylistId, channelId : ChannelId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let playlist = getPlaylistInternal(playlistId);

    if (playlist.owner != caller) {
      Runtime.trap("Unauthorized: Only the owner can modify this playlist");
    };

    let existingChannels = playlist.channels;
    let exists = existingChannels.findIndex(func(c) { c == channelId });

    if (exists != null) {
      Runtime.trap("Channel already exists in the playlist");
    };

    let updatedChannels = existingChannels.concat([channelId]);
    let updatedPlaylist = {
      playlist with channels = updatedChannels;
    };

    playlistStore.add(playlistId, updatedPlaylist);
  };

  public shared ({ caller }) func removeChannelFromPlaylist(playlistId : PlaylistId, channelId : ChannelId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let playlist = getPlaylistInternal(playlistId);

    if (playlist.owner != caller) {
      Runtime.trap("Unauthorized: Only the owner can modify this playlist");
    };

    let filteredChannels = playlist.channels.filter(func(id) { id != channelId });
    let updatedPlaylist = {
      playlist with channels = filteredChannels;
    };

    playlistStore.add(playlistId, updatedPlaylist);
  };

  public query ({ caller }) func getMyPlaylists() : async [Playlist] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let playlistIds = switch (userPlaylists.get(caller)) {
      case (null) { List.empty<PlaylistId>() };
      case (?existing) { existing };
    };

    let playlists = playlistIds.toArray().map(
      func(id) {
        switch (playlistStore.get(id)) {
          case (null) { Runtime.trap("Playlist not found") };
          case (?plist) { plist };
        };
      }
    );
    playlists;
  };

  public query ({ caller }) func getPlaylist(playlistId : PlaylistId) : async Playlist {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let playlist = getPlaylistInternal(playlistId);
    if (playlist.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the owner can view this playlist");
    };
    playlist;
  };

  func getPlaylistInternal(playlistId : PlaylistId) : Playlist {
    switch (playlistStore.get(playlistId)) {
      case (null) { Runtime.trap("Playlist with id " # playlistId.toText() # " does not exist ") };
      case (?playlist) { playlist };
    };
  };
};
