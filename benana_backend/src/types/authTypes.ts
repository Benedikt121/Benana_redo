export type authRequest = {
  username: string;
  clientPasswordHash: string;
};

export type authResponse = {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
  };
};
