
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
        <div className="w-full space-y-4 py-8">
            <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-40 bg-white/5 rounded-[24px] animate-pulse" />
        </div>
    )

    if (tournaments.length === 0) return (
        <div className="w-full py-10 text-center border-2 border-dashed border-white/5 rounded-[32px] mt-8 bg-white/2">
            <p className="text-white/20 font-bold uppercase tracking-widest text-[12px]">진행 중인 전국 대회가 없습니다</p>
            {error && <p className="text-red-500/40 text-[10px] mt-2">{error}</p>}
        </div>
    )

    return (
        <div className="w-full space-y-6 mt-8 relative">
            <div className="bg-[#CCFF00] text-black text-[10px] font-black p-1 text-center rounded-t-lg">TEST_VISIBILITY_ACTIVE</div>
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h3 className="text-[20px] font-black italic tracking-tighter text-white uppercase leading-none">
                        National <span className="text-[#CCFF00]">Tournaments</span>
                    </h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">전국 테니스 대회 일정</p>
                </div>
                <button className="text-[11px] font-black text-[#CCFF00] hover:underline uppercase italic">View All &gt;</button>
            </div>

            <div className="space-y-4">
                {tournaments.map((t, idx) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-[#121826] border border-white/5 rounded-[24px] overflow-hidden group hover:border-[#CCFF00]/30 transition-all p-5 relative"
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${t.status === 'OPEN' ? 'bg-[#CCFF00] text-black' : 'bg-white/10 text-white/40'
                                }`}>
                                {t.status}
                            </span>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col items-center justify-center min-w-[50px] py-1 border-r border-white/5">
                                <span className="text-[18px] font-black text-white leading-none">
                                    {new Date(t.start_date).getDate()}
                                </span>
                                <span className="text-[10px] font-black text-white/40 uppercase">
                                    {new Date(t.start_date).toLocaleString('en-US', { month: 'short' })}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-[15px] font-black text-white truncate mb-2 group-hover:text-[#CCFF00] transition-colors uppercase italic">
                                    {t.title}
                                </h4>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-white/40">
                                        <MapPin size={12} className="text-[#CCFF00]" />
                                        <span className="truncate">{t.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-white/40">
                                        <Trophy size={12} className="text-[#CCFF00]" />
                                        <span className="truncate">{t.category}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <a
                                    href={t.link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#CCFF00] group-hover:text-black transition-all"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="pt-2 flex flex-col items-center gap-2">
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-tighter">Information provided by KTA, KATO, KATA</p>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
        </div>
    )
}
