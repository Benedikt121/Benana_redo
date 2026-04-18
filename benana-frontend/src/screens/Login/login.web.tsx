import { useLogin } from "@/hooks/login/useLogin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  TouchableOpacity,
  View,
  Text,
  TextInput,
  ActivityIndicator,
} from "react-native";
import z from "zod";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

export default function LoginWeb() {
  type AuthFormValues = z.infer<typeof registerSchema>;
  const {
    handleLogin,
    handleRegister,
    loginSchema,
    registerSchema,

    isLoginPending,
    isLoginError,
    loginError,
    isRegisterError,
    isRegisterPending,
    registerError,
  } = useLogin();

  const [mode, setMode] = useState<"none" | "login" | "register">("none");

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(mode === "register" ? registerSchema : loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: AuthFormValues) => {
    if (mode === "login") {
      handleLogin(data.username, data.password);
    } else if (mode === "register") {
      handleRegister(data.username, data.password);
    }
  };

  const toggleMode = (clickedMode: "login" | "register") => {
    setMode((prev) => (prev === clickedMode ? "none" : clickedMode));
    reset();
  };

  const getTextStyle = (wordMode: "login" | "register") => {
    if (mode === "none") return "text-6xl opacity-80 hover:opacity-100";
    if (mode === wordMode) return "text-6xl opacity-100 mb-6";
    return "text-4xl opacity-40 hover:opacity-80";
  };
  return (
    <View className="flex-1 justify-center items-center px-4">
      <Animated.View
        layout={LinearTransition.springify().damping(15)}
        className="w-[400px] max-w-full items-center"
      >
        <View className="flex-row items-end justify-center gap-10">
          <TouchableOpacity
            onPress={() => toggleMode("login")}
            className="cursor-pointer"
          >
            <Animated.Text
              layout={LinearTransition.springify().damping(15)}
              className={`font-bold text-white transition-all duration-300 ${getTextStyle("login")}`}
            >
              Login
            </Animated.Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleMode("register")}
            className="cursor-pointer"
          >
            <Animated.Text
              layout={LinearTransition.springify().damping(15)}
              className={`font-bold text-white transition-all duration-300 ${getTextStyle("register")}`}
            >
              Register
            </Animated.Text>
          </TouchableOpacity>
        </View>

        {mode !== "none" && (
          <Animated.View
            entering={FadeInDown.springify().damping(15)}
            exiting={FadeOutUp.duration(150)}
            className="w-full bg-black/40 p-8 rounded-3xl border border-white/20 backdrop-blur-xl shadow-2xl mt-4"
          >
            <View className="mb-5">
              <Text className="text-white/80 mb-2 ml-1 font-medium">
                Username
              </Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`bg-white/10 text-white px-4 py-3 rounded-xl border outline-none transition-colors ${errors.username
                        ? "border-red-500"
                        : "border-transparent focus:border-white/50"
                      }`}
                    placeholder="Username eingeben..."
                    placeholderTextColor="#9ca3af"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.username && (
                <Text className="text-red-400 text-xs mt-1 ml-2">
                  {errors.username.message}
                </Text>
              )}
            </View>

            <View className="mb-5">
              <Text className="text-white/80 mb-2 ml-1 font-medium">
                Passwort
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`bg-white/10 text-white px-4 py-3 rounded-xl border outline-none transition-colors ${errors.password
                        ? "border-red-500"
                        : "border-transparent focus:border-white/50"
                      }`}
                    placeholder="Passwort eingeben..."
                    placeholderTextColor="#9ca3af"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    secureTextEntry
                  />
                )}
              />
              {errors.password && (
                <Text className="text-red-400 text-xs mt-1 ml-2">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {mode === "login" && isLoginError && (
              <Text className="text-red-400 text-center mb-4">
                Fehler beim Anmelden. Bitte überprüfe deine Daten.
              </Text>
            )}
            {mode === "register" && isRegisterError && (
              <Text className="text-red-400 text-center mb-4">
                Fehler bei der Registrierung.
              </Text>
            )}

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoginPending || isRegisterPending}
              className="bg-white py-4 rounded-xl items-center shadow-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {isLoginPending || isRegisterPending ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-bold text-lg">
                  {mode === "login" ? "Anmelden" : "Account erstellen"}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
