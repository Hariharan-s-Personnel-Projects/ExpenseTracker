import { NextResponse } from "next/server";
import { deleteBusinessSessionCookie } from "@/lib/auth/business-session";

export async function GET(request: Request) {
  await deleteBusinessSessionCookie();
  return NextResponse.redirect(new URL("/business/login", request.url));
}
