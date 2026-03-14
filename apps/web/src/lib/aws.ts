import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { SESClient } from "@aws-sdk/client-ses";

const region = process.env.AWS_REGION!;

export const cognito = new CognitoIdentityProviderClient({ region });
export const ses = new SESClient({ region });