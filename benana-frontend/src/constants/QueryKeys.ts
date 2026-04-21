export const QUERY_KEYS = {
  AUTH: {
    LOGIN: ["auth", "login"] as const,
    USER: ["auth", "user"] as const,
  },
  USER: {
    ME: ["user", "me"] as const,
    USER_BY_ID: (userId: string) => ["user", "id", userId] as const,
    USER_BY_NAME: (username: string) => ["user", "name", username] as const,
  },
  FRIENDS: {
    FRIENDLIST: ["friends", "list"] as const,
    FRIENDREQUESTS: ["friends", "requests"] as const,
  },
  INVITES: {
    ROOM_INVITES: ["invites", "all_room"] as const,
  },
};
