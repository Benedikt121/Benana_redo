import { Platform, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

export function ImageUploader() {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View>
      <Pressable onPress={pickImage}>
        <Text className="text-white text-xl font-bold">Bild auswählen</Text>
      </Pressable>
    </View>
  );
}
