export interface IUserDTO {
  name: string;
  user: string;
  email: string;
  password: string;
}

export interface IPublicUser {
  id: string;
  accountId: string;
  name: string;
  user: string;
  email: string;
  createdAt: string;
}
