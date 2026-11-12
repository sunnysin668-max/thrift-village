
const SUPABASE_URL = "https://ijomjikropsvemvkpgea.supabase.co";
const SUPABASE_KEY = "sb_publishable_zPVXRAyB0YFaobExPW-g3w_gdw3zI0C";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

console.log("Supabase Client:", supabaseClient);


async function testSupabaseConnection() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .limit(1);

    if (error) {
        console.error("Supabase Error:", error.message);
    } else {
        console.log("Supabase Connected Successfully!", data);
    }
}

testSupabaseConnection();