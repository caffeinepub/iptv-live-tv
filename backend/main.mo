import Map "mo:core/Map";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type ChannelId = Nat;
  type Channel = {
    id : ChannelId;
    name : Text;
    streamUrl : Text;
    language : Text;
    country : Text;
    thumbnailUrl : Text;
  };

  module Channel {
    public func compareByName(channel1 : Channel, channel2 : Channel) : Order.Order {
      Text.compare(channel1.name, channel2.name);
    };
  };

  let channelStore = Map.empty<ChannelId, Channel>();
  var channelCounter = 0;

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let favouriteChannels = Map.empty<Principal, Set.Set<ChannelId>>();

  // User profile functions (required by frontend)
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

  // Channel management (admin only for mutations)
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

  // Reading channels is public (no auth required)
  public query func getChannels() : async [Channel] {
    channelStore.values().toArray().sort(Channel.compareByName);
  };

  // Favourites management (user only)
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
};
