import { useLogin } from "@/hooks/login/useLogin";
import { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function LoginMobile() {
  type AuthFormValues = z.infer<typeof registerSchema>;
  const {
    handleLogin,
    handleRegister,
    loginSchema,
    registerSchema,
    isLoginPending,
    isLoginError,
    loginError,
    isRegisterPending,
    isRegisterError,
    registerError,
  } = useLogin();

  const [isLogin, setIsLogin] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: AuthFormValues) => {
    if (isLogin) {
      handleLogin(data.username, data.password);
    } else {
      handleRegister(data.username, data.password);
    }
  };

  const toggleState = () => {
    setIsLogin(!isLogin);
    reset();
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-8"
      >
        <View className="bg-zinc-900/90 p-6 rounded-3xl border border-white/20 shadow-2xl">
          <Text className="text-white text-3xl font-bold mb-6 text-center">
            {isLogin ? "Login" : "Registrieren"}
          </Text>

          <View className="mb-4">
            <Text className="text-white/70 mb-2 ml-1">Username</Text>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-zinc-800 text-white px-4 py-3 rounded-xl border ${
                    errors.username ? "border-red-500" : "border-white/20"
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
              <Text className="text-red-400 text-xs mt-1 ml-1">
                {errors.username.message}
              </Text>
            )}
          </View>
          <View className="mb-6">
            <Text className="text-white/70 mb-2 ml-1">Passwort</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-zinc-800 text-white px-4 py-3 rounded-xl border ${
                    errors.password ? "border-red-500" : "border-white/20"
                  }`}
                  placeholder="Passwort eingeben..."
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.password && (
              <Text className="text-red-400 text-xs mt-1 ml-1">
                {errors.password.message}
              </Text>
            )}
          </View>

          {(isLoginError || isRegisterError) && isLogin && (
            <Text className="text-red-400 text-center mb-4">
              Fehler beim Anmelden. Bitte überprüfe deine Daten.
            </Text>
          )}

          {(isLoginError || isRegisterError) && !isLogin && (
            <Text className="text-red-400 text-center mb-4">
              Fehler beim Registrieren. Der Username ist bereits vergeben.
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoginPending || isRegisterPending}
            className={`py-4 rounded-xl items-center shadow-lg ${
              isLoginPending || isRegisterPending ? "bg-white/50" : "bg-white"
            }`}
          >
            {isLoginPending || isRegisterPending ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text className="text-black font-bold text-lg">
                {isLogin ? "Anmelden" : "Account erstellen"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleState} className="mt-6 items-center">
            <Text className="text-white/70">
              {isLogin ? "Noch keinen Account? " : "Bereits einen Account? "}
              <Text className="font-bold text-white">
                {isLogin ? "Registrieren" : "Anmelden"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
