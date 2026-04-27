import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { signToken } from "@/lib/auth";
import UserModel from "@/models/user.model";
import bcrypt from 'bcrypt';
import { attachAuthCookie } from "@/lib/cookies";
import { UserRole } from "@/shared/enum/UserRole.enum";
import InstructorModel from "@/models/instructor.model";
import LearnerModel from "@/models/learner.model";
import { EducationLevel } from "@/shared/enum/EducationLevel.enum";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { name, email, password, role } = await req.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 }
            );
        }

        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            name,
            email,
            password: hashedPassword,
            role,
        });

        if (role === UserRole.INSTRUCTOR) {
            await InstructorModel.create({
                instructorId: user._id,
                subjects: [],
                bio: "",
                education: [],
            });
        }

        if (role === UserRole.LEARNER) {
            await LearnerModel.create({
                learnerId: user._id,
                bio: "",
                educationLevel: EducationLevel.SCHOOL,
                interests: [],
            });
        }

        const token = signToken({
            userId: user._id.toString(),
            role: user.role,
        });

        const response = NextResponse.json(
            {
                message: "User registered successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );

        return attachAuthCookie(response, token);
    } catch (error) {
        console.error("REGISTER_ERROR", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
