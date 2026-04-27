import { UserRole } from "@/shared/enum/UserRole.enum";
import { UserDocument } from "@/shared/types/user.types";
import { model, models, Schema } from "mongoose";

const UserSchema = new Schema<UserDocument>({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please use a valid email address"],
    },

    password: {
        type: String,
        required: true,
        select: false,
    },

    role: {
        type: String,
        enum: Object.values(UserRole),
        required: true,
    },
});

const UserModel = models.User ||
    model<UserDocument>("User", UserSchema);

export default UserModel;