import { BackendSongInfo, SongInfo } from "./MusicTypes";

export interface Friend {
  musicState: SongInfo | null;
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    color: string;
    profilePictureURL: string;
  };
}
