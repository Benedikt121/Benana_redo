export const QUERY_KEYS = {
  AUTH: {
    LOGIN: ["auth", "login"] as const,
    USER: ["auth", "user"] as const,
  },
  USER: {
    ME: ["user", "me"] as const,
  },
  FRIENDS: {
    FRIENDLIST: ["friends", "list"] as const,
    FRIENDREQUESTS: ["friends", "requests"] as const,
  },
  INVITES: {
    ROOM_INVITES: ["invites", "all_room"] as const,
  },
};
