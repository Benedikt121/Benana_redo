import React from "react";
import { FriendRequestToast } from "@/components/friends/FriendRequestToast";
import { FriendRequest } from "@/types/FriendTypes";
import { toast as sonnerToast } from "sonner-native";
import { triggerHaptic } from "./haptics";

/**
 * Premium toast utility wrapping sonner-native.
 * Use this to provide consistent, high-quality feedback to users.
 */
export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
    });
    triggerHaptic("success");
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
    });
    triggerHaptic("error");
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
    });
    triggerHaptic("selection");
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
    });
    triggerHaptic("warning");
  },
  incomingFriendRequest: (friendRequest: FriendRequest) => {
    sonnerToast.custom(
      <FriendRequestToast
        friendRequest={friendRequest}
        description="Anfrage erhalten"
      />,
    );
    triggerHaptic("medium");
  },
  custom: sonnerToast,
};
