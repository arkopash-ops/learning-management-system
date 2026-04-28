import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { attachAuthCookie } from "@/lib/cookies";
import UserModel from "@/models/user.model";
import bcrypt from 'bcrypt';


// login api
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { email, password } = await req.json();

        const user = await UserModel.findOne({ email }).select("+password");

        if (!user) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        const token = signToken({
            userId: user._id.toString(),
            role: user.role,
        });

        const response = NextResponse.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

        return attachAuthCookie(response, token);
    } catch (error) {
        console.error("LOGIN_ERROR", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
