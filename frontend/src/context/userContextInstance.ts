import { createContext } from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IUserContext {}

export const UserContext = createContext<IUserContext | null>(null);
