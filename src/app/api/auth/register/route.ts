import { NextResponse } from "next/server";

// Public registration is disabled.
// Account creation is restricted to admins via /api/admin/users.
export async function POST() {
  return NextResponse.json(
    { error: "Registration is not available. Contact your administrator." },
    { status: 404 }
  );
}
