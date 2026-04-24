import {
  Platform,
  Text,
  View,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { ImageUploader } from "./ImageUploader";
import { ColorChanger } from "./ColorChanger";
import { BackgroundChanger } from "./BackgroundChanger";
import { useState } from "react";
import { BlurView } from "expo-blur";

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

  if (!isVisible) return null;

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

  if (Platform.OS !== "web") {
    return (
      <BlurView
        onLayout={(e) => setPopupWidth(e.nativeEvent.layout.width)}
        intensity={30}
        tint="light"
        className="absolute w-[90%] h-2/3 bg-white/20 rounded-3xl border-2 border-white/10 shadow-2xl overflow-hidden"
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
    );
  }

  // Web Version
  return (
    <View className="absolute w-1/2 h-2/3 bg-white/20 rounded-3xl border-2 border-white/10 shadow-2xl backdrop-blur-sm flex flex-row overflow-hidden">
      {sections.map((section, index) => (
        <View
          key={index}
          className="flex-1 justify-start items-center pt-10 px-10"
        >
          <Text className="text-white text-2xl font-bold mb-4 self-start">
            {section.title}
          </Text>
          {section.content}
        </View>
      ))}
    </View>
  );
}
