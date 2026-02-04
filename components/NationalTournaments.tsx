
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
        <div className="w-full space-y-6 mt-8 p-4 border-2 border-dashed border-[#CCFF00] rounded-[32px]">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h3 className="text-[20px] font-black italic tracking-tighter text-white uppercase leading-none">
                        National <span className="text-[#CCFF00]">Tournaments</span>
                    </h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">전국 테니스 대회 일정</p>
                </div>
            </div>

            <div className="space-y-4">
                {tournaments.length === 0 ? (
                    <p className="text-white/20 text-center py-10 font-bold">진행 중인 대회가 없습니다.</p>
                ) : (
                    tournaments.map((t, idx) => (
                        <div
                            key={t.id}
                            className="bg-[#121826] border border-white/10 rounded-[20px] p-4 flex gap-4 items-center"
                        >
                            <div className="min-w-[40px] text-center border-r border-white/5 pr-4">
                                <span className="block text-[16px] font-black text-[#CCFF00]">{new Date(t.start_date).getDate()}</span>
                                <span className="block text-[10px] font-bold text-white/40 uppercase">{new Date(t.start_date).toLocaleString('en-US', { month: 'short' })}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-white text-[14px] truncate italic uppercase">{t.title}</h4>
                                <p className="text-white/40 text-[10px] truncate">{t.location}</p>
                            </div>
                            <a href={t.link_url} target="_blank" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#CCFF00]">
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
