// src/app/_diag/build-env/page.tsx

export default function BuildEnvCheck() {
  return (
    <pre style={{ padding: 24 }}>
      NEXT_PUBLIC_SUPABASE_URL:{" "}
      {process.env.NEXT_PUBLIC_SUPABASE_URL ? "PRESENT" : "MISSING"}

      {"\n"}
      NEXT_PUBLIC_SUPABASE_ANON_KEY:{" "}
      {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "PRESENT" : "MISSING"}
    </pre>
  );
}
