'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { MapPin, ExternalLink, AlertCircle, Loader2, Trophy, Bug } from 'lucide-react'

export interface Tournament {
    id: string
    name: string
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
        setError(null)
        const supabase = createClient()
        try {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .is('club_id', null)
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

    return (
        <div className="w-full space-y-6 mb-12 p-6 border-2 border-[#CCFF00]/20 rounded-[32px] bg-gradient-to-b from-[#121826] to-transparent relative overflow-hidden group">
            {/* Glossy Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-[60px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-end relative z-10">
                <div className="space-y-1">
                    <h3 className="text-[22px] font-black italic tracking-tighter text-white uppercase leading-none">
                        National <span className="text-[#CCFF00]">Tournaments</span>
                    </h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">2026 대한민국 테니스 대회 일정</p>
                </div>
                <div className="bg-[#CCFF00] text-black text-[9px] font-black px-2 py-0.5 rounded italic">LIVE</div>
            </div>

            {loading ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-[#CCFF00] animate-spin" />
                    <p className="text-[#CCFF00] font-black text-[12px] italic">UPDATING SCHEDULE...</p>
                </div>
            ) : error ? (
                <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[32px] mb-10 text-center">
                    <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
                    <h4 className="text-white font-black italic mb-1 uppercase">Connection Error</h4>
                    <button onClick={fetchTournaments} className="mt-2 text-[#CCFF00] underline font-bold">RETRY</button>
                </div>
            ) : tournaments.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                    <Trophy className="text-white/10 mx-auto mb-3" size={32} />
                    <p className="text-white/20 font-black uppercase tracking-widest text-[13px]">No National Events Found</p>
                </div>
            ) : (
                <div className="space-y-3 relative z-10">
                    {tournaments.map((t, idx) => (
                        <motion.div
                            key={t.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-[#1A212F] border border-white/5 rounded-[24px] p-5 flex gap-5 items-center hover:border-[#CCFF00]/40 transition-all hover:bg-[#1E2636]"
                        >
                            <div className="min-w-[55px] text-center border-r border-white/10 pr-5">
                                <span className="block text-[20px] font-black text-[#CCFF00] leading-none mb-1">
                                    {t.start_date ? new Date(t.start_date).getDate() : '?'}
                                </span>
                                <span className="block text-[10px] font-black text-white/30 uppercase">
                                    {t.start_date ? new Date(t.start_date).toLocaleString('en-US', { month: 'short' }) : 'MON'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 leading-none">
                                    <span className="px-1.5 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[8px] font-black rounded uppercase tracking-tighter">
                                        {t.category || 'TENNIS'}
                                    </span>
                                    <span className="text-white/20 text-[9px] font-bold uppercase truncate">{t.organizer}</span>
                                </div>
                                <h4 className="font-black text-white text-[15px] truncate italic uppercase tracking-tight">{t.name}</h4>
                                <p className="text-white/40 text-[11px] truncate mt-1 flex items-center gap-1">
                                    <MapPin size={10} className="text-[#CCFF00]/40" />
                                    {t.location}
                                </p>
                            </div>
                            {t.link_url && (
                                <a href={t.link_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black transition-all">
                                    <ExternalLink size={16} />
                                </a>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
