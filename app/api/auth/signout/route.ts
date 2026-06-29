import { signOut } from "@/app/actions/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await signOut();
  } catch {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
