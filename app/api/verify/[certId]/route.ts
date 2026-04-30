import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CertificateModel from "@/models/certificate.model";


// api for verify Certificate
export async function GET(
    req: Request,
    context: { params: Promise<{ certId: string }> }
) {
    try {
        await connectDB();

        const { certId } = await context.params;
        if (!certId) {
            return NextResponse.json(
                { success: false, message: "ID is required" },
                { status: 400 }
            );
        }

        const certificate = await CertificateModel.findOne({
            certId: certId,
        }).lean();

        if (!certificate) {
            return NextResponse.json(
                { valid: false, message: "Invalid certificate" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            valid: true,
            certificate,
        });
    } catch {
        return NextResponse.json(
            { valid: false, message: "Server error" },
            { status: 500 }
        );
    }
}
