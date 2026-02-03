const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://axeppqumhopbunysuhuj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O2N5uSscOItbghQFNxvigg_Z1gl5WkC';

const TARGET_CLUB_ID = '3e5ffdad-0281-4679-bd52-e5d9cca7d189';

async function checkSync() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: members, error: mError } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', TARGET_CLUB_ID);

    console.log(`Members in club ${TARGET_CLUB_ID}:`, members?.length || 0);

    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, nickname, club_id');

    console.log("Total Profiles:", profiles?.length || 0);
    console.log("Profiles with this club_id:", profiles?.filter(p => p.club_id === TARGET_CLUB_ID).length);
}

checkSync();
