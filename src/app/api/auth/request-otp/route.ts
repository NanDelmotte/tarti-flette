import { NextResponse } from "next/server"; import { createClient } from "@supabase/supabase-js"; import twilio from "twilio";

export async function POST(request: Request) {
const { phone } = await request.json();

if (!phone) {
return NextResponse.json(
{ error: "Phone number is required" },
{ status: 400 }
);
}

// Generate 6-digit OTP
const code = Math.floor(100000 + Math.random() * 900000).toString();

// Initialize Supabase client
const supabase = createClient(
process.env.SUPABASE_URL!,
process.env.SUPABASE_ANON_KEY!
);

// Save OTP into the database
const { error: dbError } = await supabase
.from("otp_codes")
.insert({ phone, code });

if (dbError) {
console.error("Supabase error:", dbError);
return NextResponse.json(
{ error: "Could not store OTP" },
{ status: 500 }
);
}

// Initialize Twilio client
const client = twilio(
process.env.TWILIO_ACCOUNT_SID!,
process.env.TWILIO_AUTH_TOKEN!
);

// Attempt to send SMS
try {
await client.messages.create({
body: `Your tarti-flette login code is: ${code},`, 
from: process.env.TWILIO_PHONE_NUMBER!,
to: phone,
});
} catch (err) {
console.error("Twilio error:", err);
return NextResponse.json(
{ error: "Failed to send SMS" },
{ status: 500 }
);
}

return NextResponse.json({ ok: true, message: "OTP sent successfully" });
}
