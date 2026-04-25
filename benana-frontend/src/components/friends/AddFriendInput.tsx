import React, { useState } from "react";
import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useFriendActions } from "@/hooks/friends/useFriendActions";

interface AddFriendInputProps {
  compact?: boolean;
}

export const AddFriendInput: React.FC<AddFriendInputProps> = ({
  compact = false,
}) => {
  const [username, setUsername] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { sendRequest, isSending } = useFriendActions();

  const handleSend = () => {
    if (!username.trim()) return;
    sendRequest(username.trim(), {
      onSuccess: () => {
        setUsername("");
        setShowInput(false);
      },
    });
  };

  return (
    <Animated.View layout={Layout.springify()}>
      {compact && !showInput ? (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Pressable
            onPress={() => setShowInput(true)}
            className="w-10 h-10 rounded-full items-center justify-center self-center my-2"
          >
            <Ionicons name="person-add" size={20} color="white" />
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(400)}
          className={`px-4 my-2 ${compact ? "flex-col items-center" : "flex-row items-center"} gap-2`}
        >
          <View
            className={`flex-1 flex-row items-center bg-white/5 border rounded-full px-4 py-2 ${isFocused ? "border-white/30" : "border-white/10"}`}
          >
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Benutzername..."
              placeholderTextColor="#888"
              className="flex-1 text-white text-sm outline-none"
              autoCapitalize="none"
              onSubmitEditing={handleSend}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Pressable onPress={handleSend} className="pl-1">
                <Ionicons name="send" size={18} color="#fff" />
              </Pressable>
            )}
          </View>
          {showInput && (
            <Pressable onPress={() => setShowInput(false)} className="p-2">
              <Ionicons name="close" size={20} color="#888" />
            </Pressable>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};
