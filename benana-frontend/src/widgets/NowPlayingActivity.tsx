import { Text, Image, HStack, VStack } from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  padding,
  cornerRadius,
  frame,
} from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity } from "expo-widgets";

type NowPlayingProps = {
  title: string;
  artist: string;
  albumArtUrl: string;
  isPlaying: boolean;
};

const NowPlayingActivity = (props: NowPlayingProps, environment: any) => {
  "widget";

  const accentColor =
    environment.colorScheme === "dark" ? "#FFFFFF" : "#1DB954";

  return {
    // Lock Screen banner
    banner: (
      <HStack modifiers={[padding({ all: 12 })]}>
        <Image
          uiImage={props.albumArtUrl}
          modifiers={[cornerRadius(8), frame({ width: 48, height: 48 })]}
        />
        <VStack modifiers={[padding({ leading: 10 })]}>
          <Text
            modifiers={[
              font({ weight: "bold", size: 15 }),
              foregroundStyle(accentColor),
            ]}
          >
            {props.title}
          </Text>
          <Text
            modifiers={[
              font({ size: 13 }),
              foregroundStyle("rgba(255,255,255,0.6)"),
            ]}
          >
            {props.artist}
          </Text>
        </VStack>
      </HStack>
    ),

    // Dynamic Island compact — left side
    compactLeading: (
      <Image
        uiImage={props.albumArtUrl}
        modifiers={[cornerRadius(6), frame({ width: 28, height: 28 })]}
      />
    ),

    // Dynamic Island compact — right side
    compactTrailing: (
      <Text modifiers={[foregroundStyle(accentColor)]}>
        {props.isPlaying ? "▶" : "⏸"}
      </Text>
    ),

    // Dynamic Island minimal (when multiple live activities)
    minimal: (
      <Image
        uiImage={props.albumArtUrl}
        modifiers={[cornerRadius(6), frame({ width: 24, height: 24 })]}
      />
    ),

    // Dynamic Island expanded — leading
    expandedLeading: (
      <Image
        uiImage={props.albumArtUrl}
        modifiers={[cornerRadius(10), frame({ width: 48, height: 48 })]}
      />
    ),

    // Dynamic Island expanded — trailing
    expandedTrailing: (
      <VStack modifiers={[padding({ trailing: 8 })]}>
        <Text
          modifiers={[
            font({ weight: "semibold", size: 14 }),
            foregroundStyle("#FFFFFF"),
          ]}
        >
          {props.title}
        </Text>
        <Text
          modifiers={[
            font({ size: 12 }),
            foregroundStyle("rgba(255,255,255,0.55)"),
          ]}
        >
          {props.artist}
        </Text>
      </VStack>
    ),

    // Dynamic Island expanded — bottom
    expandedBottom: (
      <Text
        modifiers={[
          font({ size: 11 }),
          foregroundStyle("rgba(255,255,255,0.4)"),
          padding({ bottom: 4 }),
        ]}
      >
        {props.isPlaying ? "Playing" : "Paused"}
      </Text>
    ),
  };
};

export default createLiveActivity("NowPlayingActivity", NowPlayingActivity);
