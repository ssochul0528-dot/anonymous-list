
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Calendar, MapPin, ExternalLink, Trophy } from 'lucide-react'

export interface Tournament {
    id: string
    title: string
    organizer: string
    start_date: string
    end_date: string
    location: string
    category: string
    link_url: string
    status: string
}

export default function NationalTournaments() {
    const [tournaments, setTournaments] = useState<Tournament[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchTournaments()
    }, [])

    const fetchTournaments = async () => {
        setLoading(true)
        const supabase = createClient()
        try {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .order('start_date', { ascending: true })
                .limit(5)

            if (error) throw error
            setTournaments(data || [])
        } catch (err: any) {
            console.error('Fetch error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="w-full space-y-4 py-8 text-center">
            <p className="text-[#CCFF00] font-bold text-[12px] animate-pulse">LOADING NATIONAL TOURNAMENTS...</p>
            <div className="h-32 bg-white/5 rounded-[24px] animate-pulse" />
        </div>
    )

    if (tournaments.length === 0) return (
        <div className="w-full py-10 text-center border-2 border-dashed border-white/5 rounded-[32px] mt-8 bg-white/2">
            <p className="text-white/20 font-bold uppercase tracking-widest text-[12px]">진행 중인 전국 대회가 없습니다</p>
            {error && <p className="text-red-500/40 text-[10px] mt-2">{error}</p>}
        </div>
    )

    return (
        <div className="bg-blue-600 p-20 text-white font-black text-center rounded-[40px]">
            HELLO!!! I AM THE TOURNAMENT SECTION!!
            <br />
            DATA COUNT: {tournaments.length}
        </div>
    )
}
