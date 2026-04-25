import { Platform, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState, useEffect } from "react";
import { useUserStore } from "@/store/user.store";
import { API_URL } from "@/constants/API_CONSTANTS";
import { QUERY_KEYS } from "@/constants/QueryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadProfilePicture } from "@/api/user.api";

const CIRCLE_SIZE = 200;

export function ImageUploader({
  onEditingChange,
}: {
  onEditingChange?: (isEditing: boolean) => void;
}) {
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);
  const queryClient = useQueryClient();

  const [image, setImage] = useState<string | null>(
    profile?.profilePictureUrl ?? null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(1);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const asset = result.assets[0];
      setImage(asset.uri);
      setImageSize({ width: asset.width, height: asset.height });
      setIsEditing(true);

      // Reset values
      translateX.value = 0;
      translateY.value = 0;
      scale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      savedScale.value = 1;
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const ar = imageSize.width / imageSize.height;
      const displayedWidth =
        Math.max(CIRCLE_SIZE, CIRCLE_SIZE * ar) * scale.value;
      const displayedHeight =
        Math.max(CIRCLE_SIZE, CIRCLE_SIZE / ar) * scale.value;

      const limitX = (displayedWidth - CIRCLE_SIZE) / 2;
      const limitY = (displayedHeight - CIRCLE_SIZE) / 2;

      translateX.value = Math.min(
        limitX,
        Math.max(-limitX, savedTranslateX.value + e.translationX),
      );
      translateY.value = Math.min(
        limitY,
        Math.max(-limitY, savedTranslateY.value + e.translationY),
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, savedScale.value * e.scale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Scroll to zoom on web
  useEffect(() => {
    if (Platform.OS === "web" && isEditing) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const scaleFactor = 1.05;
        let newScale;
        if (e.deltaY > 0) {
          newScale = Math.max(1, scale.value / scaleFactor);
        } else {
          newScale = Math.min(5, scale.value * scaleFactor);
        }

        scale.value = newScale;
        savedScale.value = newScale;

        // Re-clamp translation if we zoom out
        const ar = imageSize.width / imageSize.height;
        const displayedWidth =
          Math.max(CIRCLE_SIZE, CIRCLE_SIZE * ar) * newScale;
        const displayedHeight =
          Math.max(CIRCLE_SIZE, CIRCLE_SIZE / ar) * newScale;

        const limitX = (displayedWidth - CIRCLE_SIZE) / 2;
        const limitY = (displayedHeight - CIRCLE_SIZE) / 2;

        translateX.value = Math.min(
          limitX,
          Math.max(-limitX, translateX.value),
        );
        translateY.value = Math.min(
          limitY,
          Math.max(-limitY, translateY.value),
        );
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      };

      window.addEventListener("wheel", handleWheel, { passive: false });
      return () => window.removeEventListener("wheel", handleWheel);
    }
  }, [isEditing, imageSize]);

  const handleApply = async () => {
    if (!image) return;
    setIsUploading(true);

    try {
      // Calculate displayed dimensions based on "cover" content fit and current scale
      const scaleToFill = Math.max(
        CIRCLE_SIZE / imageSize.width,
        CIRCLE_SIZE / imageSize.height,
      );
      const totalScale = scaleToFill * scale.value;

      const cropSize = CIRCLE_SIZE / totalScale;
      const originX =
        (imageSize.width - cropSize) / 2 - translateX.value / totalScale;
      const originY =
        (imageSize.height - cropSize) / 2 - translateY.value / totalScale;

      const result = await ImageManipulator.manipulateAsync(
        image,
        [
          {
            crop: {
              originX: Math.max(0, originX),
              originY: Math.max(0, originY),
              width: cropSize,
              height: cropSize,
            },
          },
          { resize: { width: 1000 } },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      const updatedUser = await uploadProfilePicture(result.uri);
      await setProfile(updatedUser.data);

      // Invalidate queries to sync the rest of the app
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ME });

      // Update local state and add a cache-buster if it's a URL
      if (updatedUser.data.profilePictureUrl) {
        setImage(`${updatedUser.data.profilePictureUrl}?t=${Date.now()}`);
      }

      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const getSource = () => {
    if (!image || image === "/public/uploads/avatar_placeholder.png") {
      return require("../../../assets/uploads/avatar_placeholder.png");
    }

    if (
      image.startsWith("file://") ||
      image.startsWith("http") ||
      image.startsWith("data:") ||
      image.startsWith("blob:")
    ) {
      return { uri: image };
    }

    return { uri: `${API_URL}${image.startsWith("/") ? "" : "/"}${image}` };
  };

  if (isEditing) {
    return (
      <View className="items-center mt-6">
        <View
          style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
          className="overflow-hidden rounded-full border-4 border-white/30 bg-black/20"
        >
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              style={[
                {
                  width: "100%",
                  height: "100%",
                  touchAction: "none",
                  userSelect: "none",
                },
                animatedStyle,
              ]}
            >
              <Image
                source={{ uri: image ?? undefined }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                draggable={false}
              />
            </Animated.View>
          </GestureDetector>
        </View>

        <Text className="text-white/40 mt-4 text-xs">
          Ziehen zum Verschieben • Pitchen zum Zoomen
        </Text>

        <View className="flex-row mt-8 gap-4">
          <Pressable
            onPress={() => {
              setIsEditing(false);
              setImage(profile?.profilePictureUrl ?? null);
            }}
            className="px-6 py-3 rounded-full bg-white/10 border border-white/20 active:bg-white/20 justify-center items-center"
          >
            <Text className="text-white font-semibold">Abbrechen</Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            disabled={isUploading}
            className={`px-10 py-3 rounded-full active:opacity-80 ${isUploading ? "bg-white/20" : "bg-white"} justify-center items-center`}
          >
            <Text
              className={`font-bold text-lg ${isUploading ? "text-white/50" : "text-black"}`}
            >
              {isUploading ? "Lädt..." : "Anwenden"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-6 items-center">
      <Pressable
        onPress={pickImage}
        style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
        className="overflow-hidden rounded-full border-2 border-white/20 items-center justify-center bg-white/5"
      >
        <Image
          source={getSource()}
          style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
          contentFit="cover"
          transition={200}
        />
      </Pressable>
      <Text className="text-white/50 mt-3 text-sm font-medium">
        Tippen zum Ändern
      </Text>
    </View>
  );
}
