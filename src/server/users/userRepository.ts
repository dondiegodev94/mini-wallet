import "server-only";
import type { Identifier } from "@/domain/schemas/login.schema";
import type { User } from "@/domain/models/user";

const SEED_USERS: readonly User[] = [
  { id: "usr_ana", name: "Ana García", email: "ana@miniwallet.dev", phone: "5512345678" },
  { id: "usr_luis", name: "Luis Pérez", email: "luis@miniwallet.dev", phone: "5587654321" },
];

export const userRepository = {
  async findByIdentifier(identifier: Identifier): Promise<User | undefined> {
    return SEED_USERS.find((user) => user[identifier.kind] === identifier.value);
  },
};
