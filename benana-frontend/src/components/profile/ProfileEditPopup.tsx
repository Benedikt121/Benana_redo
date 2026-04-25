import {
  Platform,
  Text,
  View,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from "react-native";
import { ImageUploader } from "./ImageUploader";
import { ColorChanger } from "./ColorChanger";
import { BackgroundChanger } from "./BackgroundChanger";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

export function ProfileEditPopup({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isSwipingDisabled, setIsSwipingDisabled] = useState(false);
  const [popupWidth, setPopupWidth] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setCurrentPage(0);
      setIsSwipingDisabled(false);
    }
  }, [isVisible]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / popupWidth);
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const sections = [
    {
      title: "Profilbild ändern",
      content: <ImageUploader onEditingChange={setIsSwipingDisabled} />,
    },
    {
      title: "Farbe ändern",
      content: <ColorChanger onEditingChange={setIsSwipingDisabled} />,
    },
    {
      title: "Hintergrund ändern",
      content: <BackgroundChanger onEditingChange={setIsSwipingDisabled} />,
    },
  ];

  if (!isVisible) return null;

  if (Platform.OS !== "web") {
    return (
      <View className="absolute inset-0 flex justify-center items-center z-50">
        <Pressable className="absolute inset-0 bg-black/20" onPress={onClose} />
        <BlurView
          onLayout={(e) => setPopupWidth(e.nativeEvent.layout.width)}
          intensity={30}
          tint="light"
          className="w-[90%] h-2/3 bg-white/20 rounded-3xl border-2 border-white/10 shadow-2xl overflow-hidden"
        >
          <ScrollView
            horizontal
            pagingEnabled
            scrollEnabled={!isSwipingDisabled}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            className="flex-1"
          >
            {sections.map((section, index) => (
              <View
                key={index}
                style={{ width: popupWidth }}
                className="flex-1 justify-start items-center pt-10 px-10"
              >
                <Text className="text-white text-2xl font-bold self-start mb-2">
                  {section.title}
                </Text>
                {section.content}
              </View>
            ))}
          </ScrollView>

          <View className="flex-row justify-center items-center gap-2 pb-6">
            {sections.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentPage === index ? "w-6 bg-white" : "w-2 bg-white/30"
                }`}
              />
            ))}
          </View>
        </BlurView>
      </View>
    );
  }

  // Web Version
  return (
    <View className="absolute inset-0 flex justify-center items-center z-50">
      <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
      <View className="relative w-1/2 h-2/3 bg-white/20 rounded-3xl border-2 border-white/10 shadow-2xl backdrop-blur-md flex flex-row overflow-hidden">
        <Pressable
          onPress={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <Ionicons name="close" size={24} color="white" />
        </Pressable>
        {sections.map((section, index) => (
          <View
            key={index}
            className="flex-1 justify-start items-center pt-10 px-10"
          >
            <Text
              className={`text-white text-2xl font-bold mb-4 ${index === 0 ? "text-start" : index === sections.length - 1 ? "text-end" : "text-center"}`}
            >
              {section.title}
            </Text>
            {section.content}
          </View>
        ))}
      </View>
    </View>
  );
}
