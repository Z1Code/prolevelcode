import { Resend } from "resend";
import { requireEnv } from "@/lib/env";

let resendClient: Resend | undefined;

export function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(requireEnv("resendApiKey"));
  }

  return resendClient;
}


