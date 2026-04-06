import bcrypt from "bcryptjs";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Credentials } from "@/types/AuthTypes";
import { loginUser, registerUser } from "@/api/auth.api";
import { z } from "zod";

export function useLogin() {
  const login = useAuthStore((state) => state.login);

  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: (credentials: Credentials) => loginUser(credentials),
    onSuccess: async (data) => {
      await login(data.token, data.user);
      router.replace("/");
    },
    onError: (error: any) => {
      console.error("Login failed:", error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: Credentials) => registerUser(credentials),
    onSuccess: async (data) => {
      await login(data.token, data.user);
      router.replace("/");
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);
    },
  });

  const handleLogin = (username: string, password: string) => {
    const clientPasswordHash = password; // maybe hashed in the future
    loginMutation.mutate({ username, clientPasswordHash });
  };

  const handleRegister = (username: string, password: string) => {
    const clientPasswordHash = password; // maybe hashed in the future
    registerMutation.mutate({ username, clientPasswordHash });
  };

  const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  });

  const registerSchema = z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Only letters, numbers and underscores are allowed.",
      ),
    password: z
      .string()
      .min(5, "Password must be at least 5 characters")
      .max(100, "Password must be at most 100 characters"),
  });

  return {
    handleLogin,
    handleRegister,
    loginSchema,
    registerSchema,

    isLoginPending: loginMutation.isPending,
    isLoginError: loginMutation.isError,
    loginError: loginMutation.error,

    isRegisterPending: registerMutation.isPending,
    isRegisterError: registerMutation.isError,
    registerError: registerMutation.error,
  };
}
