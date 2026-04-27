import { NextResponse } from "next/server";

export const attachAuthCookie = (res: NextResponse, token: string) => {
    res.cookies.set("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
    });

    return res;
};

export const clearAuthCookie = (res: NextResponse) => {
    res.cookies.set("token", "", {
        maxAge: 0,
        path: "/",
    });

    return res;
};
