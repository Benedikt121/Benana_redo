import React from "react";
import { View, Text } from "react-native";
import { useFriendsStore } from "@/store/friends.store";
import { FriendItem } from "./FriendItem";
import { FriendRequestItem } from "./FriendRequestItem";
import { AddFriendInput } from "./AddFriendInput";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

interface FriendListProps {
  compact?: boolean;
  showAddFriend?: boolean;
  showLabels?: boolean;
}

export const FriendList: React.FC<FriendListProps> = ({
  compact = false,
  showAddFriend = true,
  showLabels = true,
}) => {
  const { friends, friendRequests } = useFriendsStore();

  return (
    <View className="w-full">
      {/* Add Friend Input at the top */}
      {showAddFriend && (
        <View className={!compact ? "mb-2" : ""}>
          <AddFriendInput compact={compact} />
        </View>
      )}

      {/* Friend Requests - Animates in when expanded */}
      {!compact && friendRequests.length > 0 && (
        <Animated.View 
          entering={FadeInDown.duration(300)} 
          exiting={FadeOutUp.duration(200)}
          className="mb-4"
        >
          {showLabels && (
            <View className="px-4 py-2 flex-row items-center border-t border-white/5 pt-4">
              <Text className="text-white/40 font-bold text-xs uppercase tracking-widest">
                Anfragen ({friendRequests.length})
              </Text>
            </View>
          )}
          {friendRequests.map((request) => (
            <FriendRequestItem key={request.id} request={request} />
          ))}
        </Animated.View>
      )}

      {/* Friends List - Always visible */}
      <View>
        {showLabels && !compact && friends.length > 0 && (
          <Animated.View 
            entering={FadeInDown.delay(100)} 
            className="px-4 py-2"
          >
            <Text className="text-white/40 font-bold text-xs uppercase tracking-widest">
              Freunde ({friends.length})
            </Text>
          </Animated.View>
        )}
        
        {friends.length === 0 ? (
          <View className="w-full justify-center items-center py-20 px-4">
            {!compact && (
              <Text className="text-white/50 text-center text-lg">
                Noch keine Freunde hinzugefügt.
              </Text>
            )}
          </View>
        ) : (
          friends.map((friend) => (
            <FriendItem
              key={friend.friendshipId}
              friend={friend}
              compact={compact}
            />
          ))
        )}
      </View>
    </View>
  );
};
