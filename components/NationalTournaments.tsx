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
            console.log('DEBUG: Fetching tournaments...')
            // Try fetching WITHOUT any filters first to see if anything exists
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .order('start_date', { ascending: true })
                .limit(5)

            if (error) {
                console.error('DEBUG: Supabase error:', error)
                throw error
            }

            console.log('DEBUG: Data received:', data)
            setTournaments(data || [])
        } catch (err: any) {
            console.error('DEBUG: Catch error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full mb-12 border-4 border-dashed border-[#CCFF00] p-4 rounded-[40px] bg-[#CCFF00]/5">
            {/* FORCE VISIBLE HEADER */}
            <div className="flex items-center gap-2 mb-4 bg-[#CCFF00] text-black px-4 py-2 rounded-full w-fit">
                <Bug size={16} />
                <span className="font-black text-[12px] italic">DEBUG: NATIONAL TOURNAMENTS SECTION</span>
            </div>

            {loading ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-[#CCFF00] animate-spin" />
                    <p className="text-[#CCFF00] font-black text-[12px]">서버에서 데이타를 가져오는 중...</p>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-3xl text-center">
                    <AlertCircle className="text-red-500 mx-auto mb-2" size={32} />
                    <p className="text-white font-bold">오류: {error}</p>
                    <button onClick={fetchTournaments} className="mt-2 text-[#CCFF00] underline font-bold">다시 시도</button>
                </div>
            ) : tournaments.length === 0 ? (
                <div className="py-12 text-center">
                    <Trophy className="text-white/10 mx-auto mb-3" size={48} />
                    <p className="text-white font-black text-[16px] mb-1">데이터가 0개입니다</p>
                    <p className="text-white/40 text-[12px]">SQL은 성공했지만 테이블이 비어있거나 권한 문제일 수 있습니다.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="px-2">
                        <h3 className="text-[24px] font-black italic text-white uppercase leading-none">
                            National <span className="text-[#CCFF00]">Tournaments</span>
                        </h3>
                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-1">2026 경기 일정 리스트</p>
                    </div>

                    <div className="space-y-3">
                        {tournaments.map((t, idx) => (
                            <motion.div
                                key={t.id || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-[#1A212F] border border-white/10 rounded-[24px] p-5 flex gap-4 items-center"
                            >
                                <div className="min-w-[50px] text-center border-r border-white/10 pr-4">
                                    <span className="block text-[20px] font-black text-[#CCFF00]">{t.start_date ? new Date(t.start_date).getDate() : '?'}</span>
                                    <span className="block text-[10px] font-bold text-white/30 truncate">{t.start_date ? new Date(t.start_date).toLocaleString('en-US', { month: 'short' }) : 'MON'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-1.5 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[8px] font-black rounded">{t.category || 'TENNIS'}</span>
                                        <span className="text-white/20 text-[9px] font-bold truncate">{t.organizer}</span>
                                    </div>
                                    <h4 className="font-black text-white text-[15px] truncate italic uppercase">{t.name || '알 수 없는 대회'}</h4>
                                    <p className="text-white/40 text-[11px] truncate flex items-center gap-1">
                                        <MapPin size={10} /> {t.location}
                                    </p>
                                </div>
                                <a href={t.link_url} target="_blank" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#CCFF00]">
                                    <ExternalLink size={18} />
                                </a>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
