export enum UserRole {
  OWNER = "owner",
  MEMBER = "member",
}

export interface IUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithPassword extends IUser {
  password: string;
}
