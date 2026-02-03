const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://axeppqumhopbunysuhuj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O2N5uSscOItbghQFNxvigg_Z1gl5WkC';

async function listClubs() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: clubs } = await supabase.from('clubs').select('*');
    console.log("CLUBS:", JSON.stringify(clubs, null, 2));

    const { data: profiles } = await supabase.from('profiles').select('id, nickname, club_id, email');
    console.log("PROFILES (brief):", JSON.stringify(profiles.map(p => ({ n: p.nickname, c: p.club_id, e: p.email })), null, 2));
}

listClubs();
