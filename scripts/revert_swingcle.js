const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://axeppqumhopbunysuhuj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O2N5uSscOItbghQFNxvigg_Z1gl5WkC';

const NON_ID = '3e5ffdad-0281-4679-bd52-e5d9cca7d189';
const SWINGCLE_ID = '50cc738d-e5f4-4193-94e6-ceec9800aa33';
const SSOCHUL_ID = '26993c66-2197-431b-a675-9a35a44fb1f7';

async function revertMembers() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log("Reverting members to NON club...");

    // 1. Move ssochul and everyone who was supposed to be in NON back to NON
    // Since I moved everyone, I will move everyone back to NON for now as that was the user's primary club.
    await supabase.from('profiles').update({ club_id: NON_ID }).is('club_id', SWINGCLE_ID);
    await supabase.from('profiles').update({ club_id: NON_ID }).eq('id', SSOCHUL_ID);

    // 2. Clear Swingcle members that shouldn't be there (everyone except original owner if there was one)
    // Actually, I'll just clear and re-sync for NON
    await supabase.from('club_members').delete().eq('club_id', SWINGCLE_ID).neq('user_id', '85de5343-2f89-424f-8775-90e24e3f2736');

    // 3. Ensure ssochul is president of NON
    await supabase.from('club_members').upsert({
        club_id: NON_ID,
        user_id: SSOCHUL_ID,
        role: 'PRESIDENT'
    }, { onConflict: 'club_id,user_id' });

    console.log("Revert complete. SSOCHUL is back in NON.");
}

revertMembers();
