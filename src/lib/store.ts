import type { ISessionStore } from "./sessionStore";
import { MemorySessionStore } from "./sessionStoreMemory.ts";
import { PrismaSessionStore } from "./sessionStorePrisma";

export const Store: ISessionStore =
  process.env.STORE === "db" ? PrismaSessionStore : MemorySessionStore;