import { Document } from "mongoose";
import { UserRole } from "../enum/UserRole.enum";

export interface IUser {
    name: string,
    email: string,
    password: string,
    role: UserRole,
};

export interface UserDocument extends IUser, Document { };
