import jwt from "jsonwebtoken";

const teamId = process.env.APPLE_TEAM_ID!;
const keyId = process.env.APPLE_KEY_ID!;

const privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");

export const getAppleDeveloperToken = (): string => {
  const token = jwt.sign({}, privateKey, {
    algorithm: "ES256",
    expiresIn: "30d",
    issuer: teamId,
    header: {
      alg: "ES256",
      kid: keyId,
    },
  });

  return token;
};
