import bcrypt from "bcrypt";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Credentials } from "@/types/AuthTypes";
import { loginUser } from "@/api/auth.api";
import { error } from "three";

export function useLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = useAuthStore((state) => state.login);

  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (credentials: Credentials) => loginUser(credentials),
    onSuccess: async (data) => {
      await login(data.token, data.user);
      router.replace("/home");
    },
    onError: (error: any) => {
      console.error("Login failed:", error);
    },
  });

  const handleLogin = () => {
    const clientPasswordHash = bcrypt.hashSync(password, 10);
    mutation.mutate({ username, clientPasswordHash });
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    handleLogin,

    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
