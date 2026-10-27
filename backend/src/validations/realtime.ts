import { z } from "zod";

export const clientEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("room:join"), chatId: z.uuid() }),
  z.object({ type: z.literal("room:leave"), chatId: z.uuid() }),
]);
