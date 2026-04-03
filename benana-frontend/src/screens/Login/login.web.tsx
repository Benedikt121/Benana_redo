import { useLogin } from "@/hooks/login/useLogin";
import { View, Text } from "react-native";

export default function LoginMobile() {
  const {
    username,
    setUsername,
    password,
    setPassword,
    handleLogin,
    isPending,
    isError,
    error,
  } = useLogin();
  return (
    <View>
      <Text>Login Screen - Web</Text>
    </View>
  );
}
