import { useLogin } from "@/hooks/login/useLogin";
import { View, Text } from "react-native";
import z from "zod";

export default function LoginMobile() {
  type AuthFormValues = z.infer<typeof registerSchema>;
  const {
    handleLogin,
    loginSchema,
    registerSchema,
    isLoginPending: isPending,
    isLoginError: isError,
    loginError: error,
  } = useLogin();
  return (
    <View>
      <Text>Login Screen - Web</Text>
    </View>
  );
}
