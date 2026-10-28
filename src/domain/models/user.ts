export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type SessionUser = Pick<User, "id" | "name">;

export type Session = {
  userId: string;
  expiresAt: number;
};
