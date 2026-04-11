import Mux from "@mux/mux-node";
import { requireEnv } from "@/lib/env";

const globalForMux = globalThis as unknown as { mux: Mux | undefined };

function createMuxClient(): Mux {
  return new Mux({
    tokenId: requireEnv("muxTokenId"),
    tokenSecret: requireEnv("muxTokenSecret"),
    jwtSigningKey: requireEnv("muxSigningKey"),
    jwtPrivateKey: requireEnv("muxPrivateKey"),
  });
}

export function getMux(): Mux {
  if (!globalForMux.mux) {
    globalForMux.mux = createMuxClient();
  }
  return globalForMux.mux;
}
