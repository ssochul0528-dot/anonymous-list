
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('nickname').limit(10)
    if (error) {
        console.error(error)
        return
    }
    console.log('Profiles:', data)
}

checkProfiles()
