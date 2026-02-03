const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://axeppqumhopbunysuhuj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O2N5uSscOItbghQFNxvigg_Z1gl5WkC';

const SWINGCLE_ID = '50cc738d-e5f4-4193-94e6-ceec9800aa33';
const SSOCHUL_ID = '26993c66-2197-431b-a675-9a35a44fb1f7';

async function fixSwingcle() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Fix Swingcle Slug
    console.log("Fixing Swingcle slug...");
    const { error: sError } = await supabase
        .from('clubs')
        .update({ slug: '스윙클' })
        .eq('id', SWINGCLE_ID);

    if (sError) console.error("Slug fix error:", sError);

    // 2. Move Everyone from NON to SWINGCLE
    console.log("Moving all profiles to Swingcle...");
    const { error: pError } = await supabase
        .from('profiles')
        .update({ club_id: SWINGCLE_ID })
        .eq('id', SSOCHUL_ID); // Primarily ssochul

    // Actually, let's move everyone who was in 'NON' (3e5f...) to Swingcle
    const { error: pAllError } = await supabase
        .from('profiles')
        .update({ club_id: SWINGCLE_ID })
        .is('club_id', null); // Also those with null

    // For those already in NON, move them too
    await supabase.from('profiles').update({ club_id: SWINGCLE_ID }).eq('club_id', '3e5ffdad-0281-4679-bd52-e5d9cca7d189');

    // 3. Add to club_members
    console.log("Syncing club_members to Swingcle...");
    const { data: allProfiles } = await supabase.from('profiles').select('id');
    for (const p of allProfiles) {
        await supabase.from('club_members').upsert({
            club_id: SWINGCLE_ID,
            user_id: p.id,
            role: p.id === SSOCHUL_ID ? 'PRESIDENT' : 'MEMBER'
        }, { onConflict: 'club_id,user_id' });
    }

    console.log("Done! Swingcle is now the main club and ssochul is its president.");
}

fixSwingcle();
