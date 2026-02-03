const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://axeppqumhopbunysuhuj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O2N5uSscOItbghQFNxvigg_Z1gl5WkC';

const TARGET_CLUB_ID = '3e5ffdad-0281-4679-bd52-e5d9cca7d189';

async function syncMembers() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Get all users
    const { data: allProfiles, error: pError } = await supabase.from('profiles').select('id, nickname, club_id');
    if (pError) {
        console.error("Error fetching profiles:", pError);
        return;
    }

    console.log(`Target Club ID: ${TARGET_CLUB_ID}`);

    for (const p of allProfiles) {
        // We want to add users to this club if they are not the owner of another club maybe?
        // But the user said "EVERYONE in ranking". Rankings show almost everyone.
        // Let's just add all users who don't belong to this club yet.

        console.log(`Syncing ${p.nickname}...`);

        // 1. Join club_members
        const { error: joinError } = await supabase.from('club_members').upsert({
            club_id: TARGET_CLUB_ID,
            user_id: p.id,
            role: 'MEMBER'
        }, { onConflict: 'club_id,user_id' });

        if (joinError) {
            console.error(`Failed to join ${p.nickname}:`, joinError.message);
        } else {
            // 2. Update profile club_id if it's not set or different
            if (p.club_id !== TARGET_CLUB_ID) {
                await supabase.from('profiles').update({ club_id: TARGET_CLUB_ID }).eq('id', p.id);
            }
        }
    }
    console.log("All users synced to club!");
}

syncMembers();
