export type Backgrounds = "deepWater" | "rainyWindow";

export interface MeResponse {
  status: string;
  data: {
    id: string;
    username: string;
    color: string; //Hex
    profilePictureUrl: string | null;
    createdAt: Date;
    currentRoomId: string | null;
    isReady: boolean;
  };
}
