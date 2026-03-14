import crypto from "crypto";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

export const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function secretHash(username: string) {
  const clientId = mustEnv("COGNITO_CLIENT_ID");
  const secret = mustEnv("COGNITO_CLIENT_SECRET");
  return crypto.createHmac("sha256", secret).update(username + clientId).digest("base64");
}