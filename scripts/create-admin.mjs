// Creates (or promotes) an administrator account.
// Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> [full name] [admin|staff]
import { createClient } from "@supabase/supabase-js";

const [email, password, fullName = "Store Administrator", role = "admin"] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> [full name] [admin|staff]");
  process.exit(1);
}
if (!["admin", "staff"].includes(role)) {
  console.error("Role must be admin or staff");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let userId;
const { data: created, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});
if (error) {
  if (!/already/i.test(error.message)) throw error;
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  userId = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  if (!userId) throw new Error("User exists but could not be found");
  console.log("User already exists — promoting.");
} else {
  userId = created.user.id;
}

const { data: roleRow } = await supabase.from("roles").select("id").eq("name", role).single();
const { error: upd } = await supabase.from("profiles").upsert({ id: userId, email, full_name: fullName, role_id: roleRow.id, is_active: true });
if (upd) throw upd;
console.log(`${email} is now ${role}.`);
