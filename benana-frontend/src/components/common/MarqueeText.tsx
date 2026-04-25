import React, { useEffect, useState } from "react";
import { View, Text, LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

interface MarqueeTextProps {
  text: string;
  className?: string;
  containerWidth?: number;
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className,
}) => {
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const onTextLayout = (e: LayoutChangeEvent) => {
    setTextWidth(e.nativeEvent.layout.width);
  };

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    // Reset and start animation if text is longer than container
    cancelAnimation(translateX);
    cancelAnimation(opacity);
    translateX.value = 0;
    opacity.value = 1;

    if (textWidth > containerWidth && containerWidth > 0) {
      const scrollDistance = textWidth - containerWidth + 20; // Plus some padding
      const duration = scrollDistance * 30; // 30ms per pixel

      translateX.value = withRepeat(
        withSequence(
          withDelay(
            5000,
            withTiming(-scrollDistance, { duration, easing: Easing.linear }),
          ),
          // Fade out at the end
          withTiming(-scrollDistance, { duration: 500 }),
          // Instantly reset position (while invisible or during fade)
          withTiming(0, { duration: 0 }),
        ),
        -1, // Infinite
        false, // Do not reverse
      );

      opacity.value = withRepeat(
        withSequence(
          withDelay(5000 + duration, withTiming(0, { duration: 500 })),
          withTiming(0, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1,
        false,
      );
    }
  }, [textWidth, containerWidth, text]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      onLayout={onContainerLayout}
      className="flex-1 overflow-hidden h-4 justify-center"
    >
      <Animated.View
        onLayout={onTextLayout}
        style={[animatedStyle, { position: "absolute" }]}
      >
        <Text className={className} numberOfLines={1}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
};
