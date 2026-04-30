import { CertificateHashPayload } from "@/shared/types/certificate.types";
import crypto from "crypto";

const SECRET = process.env.CERT_SECRET || "fallback-secret";

export function generateCertId() {
    return "CERT-" + crypto.randomBytes(8).toString("hex").toUpperCase();
}

export function generateSignatureHash(data: CertificateHashPayload) {
    return crypto
        .createHash("sha256")
        .update(JSON.stringify(data) + SECRET)
        .digest("hex");
}
