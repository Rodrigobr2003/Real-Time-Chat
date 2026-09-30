export interface CreateUserInput {
  name: string;
  user: string;
  email: string;
  password: string;
}

export interface NewUser {
  name: string;
  user: string;
  email: string;
  passwordHash: string;
}

export interface PublicUser {
  id: string;
  accountId: string;
  name: string;
  user: string;
  email: string;
  createdAt: Date;
}
