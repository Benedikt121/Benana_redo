import Foundation from "@expo/vector-icons/Foundation";
import { Tabs } from "expo-router";
import { ProfileCircle } from "@/components/profile/profileCircle";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: "transparent" },
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(0,0,0,0.8)",
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#888888",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ size, focused }) => (
            <Foundation
              name="home"
              size={size}
              color={focused ? "white" : "#888888"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ size }) => <ProfileCircle size={size} />,
        }}
      />
    </Tabs>
  );
}
