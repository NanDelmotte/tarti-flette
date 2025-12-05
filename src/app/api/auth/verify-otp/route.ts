import { NextResponse } from "next/server"; import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
const { phone, code } = await request.json();

if (!phone || !code) {
return NextResponse.json(
{ error: "Phone and code are required" },
{ status: 400 }
);
}

const supabase = createClient(
process.env.SUPABASE_URL!,
process.env.SUPABASE_ANON_KEY!
);

const { data, error } = await supabase
.from("otp_codes")
.select("*")
.eq("phone", phone)
.eq("code", code)
.order("created_at", { ascending: false })
.limit(1);

if (error) {
console.error(error);
return NextResponse.json(
{ error: "Database error" },
{ status: 500 }
);
}

if (!data || data.length === 0) {
return NextResponse.json(
{ error: "Invalid code" },
{ status: 400 }
);
}

return NextResponse.json({ message: "OTP verified" });
}