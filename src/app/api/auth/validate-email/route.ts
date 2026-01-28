import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log("[API] Validating email:", email);

    if (!email) {
      console.log("[API] No email provided");
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Create Supabase Admin client to access auth.users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if user exists in auth.users table
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("[API] Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to validate email" },
        { status: 500 }
      );
    }

    console.log("[API] Total users in system:", data.users.length);
    const userExists = data.users.some((user) => user.email === email);
    console.log("[API] User exists:", userExists);

    return NextResponse.json({ exists: userExists });
  } catch (error) {
    console.error("[API] Error in validate-email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
