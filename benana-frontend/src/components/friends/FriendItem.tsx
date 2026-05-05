import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { ProfileCircle } from "../profile/profileCircle";
import { Friend } from "@/types/FriendTypes";
import { Ionicons } from "@expo/vector-icons";
import { MarqueeText } from "../common/MarqueeText";
import { useFriendActions } from "@/hooks/friends/useFriendActions";
import { useListeningParty } from "@/hooks/sockets/useListeningParty";
import { BlurView } from "expo-blur";

interface FriendItemProps {
  friend: Friend;
  compact?: boolean;
}

export const FriendItem: React.FC<FriendItemProps> = ({
  friend,
  compact = false,
}) => {
  const isPlaying = !!friend.musicState;
  const { unfriend } = useFriendActions();
  const { joinParty } = useListeningParty();
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleJoin = () => {
    joinParty(friend.friend.id);
    closeMenu();
  };

  const handleUnfriend = () => {
    unfriend(friend.friendshipId);
    setConfirmDelete(false);
    closeMenu();
  };

  const onJoinPress = () => {
    joinParty(friend.friend.id);
  };

  const MenuContent = () => (
    <View className="bg-[#1c1c1e] w-[280px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <View className="p-4 border-b border-white/5 items-center">
        <ProfileCircle userId={friend.friend.id} size={50} />
        <Text className="text-white font-bold text-lg mt-2">
          {friend.friend.username}
        </Text>
      </View>

      <View className="p-2">
        {isPlaying && (
          <Pressable
            onPress={handleJoin}
            className="flex-row items-center p-3 rounded-xl active:bg-white/10"
          >
            <View className="bg-[#1DB954]/20 w-8 h-8 rounded-full  items-center justify-center mr-3">
              <Ionicons name="headset" size={18} color="#1DB954" />
            </View>
            <Text className="text-white font-medium">Party beitreten</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => setConfirmDelete(true)}
          className="flex-row items-center p-3 rounded-xl active:bg-white/10"
        >
          <View className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center mr-3">
            <Ionicons name="person-remove" size={18} color="#ef4444" />
          </View>
          <Text className="text-red-500 font-medium">Freund entfernen</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={closeMenu}
        className="p-4 border-t border-white/5 items-center active:bg-white/5"
      >
        <Text className="text-white/60 font-medium">Abbrechen</Text>
      </Pressable>
    </View>
  );

  const ConfirmContent = () => (
    <View className="bg-[#1c1c1e] w-[280px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl p-6">
      <Text className="text-white font-bold text-lg text-center mb-2">
        Freund entfernen
      </Text>
      <Text className="text-white/60 text-center mb-6">
        Möchtest du {friend.friend.username} wirklich aus deiner Freundesliste
        entfernen?
      </Text>

      <View className="flex-row gap-3">
        <Pressable
          onPress={() => setConfirmDelete(false)}
          className="flex-1 p-3 rounded-xl bg-white/5 items-center active:bg-white/10"
        >
          <Text className="text-white font-medium">Abbrechen</Text>
        </Pressable>
        <Pressable
          onPress={handleUnfriend}
          className="flex-1 p-3 rounded-xl bg-red-500 items-center active:bg-red-600"
        >
          <Text className="text-white font-bold">Entfernen</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <Pressable onLongPress={openMenu} delayLongPress={500}>
        <View
          className={`flex-row items-center py-3 ${compact ? "px-2 justify-center" : "px-2"} hover:bg-gray-800/40`}
        >
          <View>
            <ProfileCircle userId={friend.friend.id} size={35} />
            <View
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${friend.isOnline ? "bg-green-500" : "bg-gray-500"} border border-[#121212]`}
              style={{
                shadowColor: friend.isOnline ? "#22c55e" : "#9ca3af",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
              }}
            />
          </View>

          {!compact && (
            <>
              <View className="ml-3 flex-1">
                <Text
                  className="text-white font-semibold text-base"
                  numberOfLines={1}
                >
                  {friend.friend.username}
                </Text>
                {isPlaying ? (
                  <View className="flex-row items-center mt-0.5 flex-1 overflow-hidden">
                    <Ionicons name="musical-notes" size={12} color="#1DB954" />
                    <MarqueeText
                      text={`${friend.musicState?.title || (friend.musicState as any)?.trackName} - ${friend.musicState?.artist}`}
                      className="text-gray-400 text-xs ml-1"
                    />
                  </View>
                ) : (
                  <Text className="text-gray-500 text-xs" numberOfLines={1}>
                    {friend.isOnline ? "Online" : "Offline"}
                  </Text>
                )}
              </View>

              <View className="flex-row items-center gap-2">
                {isPlaying && (
                  <Pressable
                    onPress={onJoinPress}
                    className="bg-[#1DB954]/20 p-2 rounded-full"
                  >
                    <Ionicons name="headset" size={16} color="#1DB954" />
                  </Pressable>
                )}
                <Pressable onPress={openMenu} className="p-2">
                  <Ionicons
                    name="ellipsis-vertical"
                    size={16}
                    color="rgba(255,255,255,0.5)"
                  />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/60 px-6"
          onPress={closeMenu}
        >
          {confirmDelete ? <ConfirmContent /> : <MenuContent />}
        </Pressable>
      </Modal>
    </>
  );
};
