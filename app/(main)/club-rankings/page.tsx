
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, Star, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ClubRankingsPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [clubRankings, setClubRankings] = useState<any[]>([])

    useEffect(() => {
        fetchClubRankings()
    }, [])

    const fetchClubRankings = async () => {
        setLoading(true)
        const supabase = createClient()
        try {
            // 1. Fetch all Clubs
            const { data: clubs, error: cError } = await supabase
                .from('clubs')
                .select('*')
                .eq('status', 'ACTIVE')

            if (cError) throw cError
            if (!clubs || clubs.length === 0) {
                setClubRankings([])
                return
            }

            // 2. Fetch all Scores
            const { data: scores } = await supabase
                .from('scores')
                .select('points, club_id')

            // 3. Aggregate Stats
            const stats = new Map()
            clubs.forEach(c => stats.set(c.id, { ...c, totalPoints: 0, memberCount: 0 }))

            scores?.forEach(s => {
                if (s.club_id && stats.has(s.club_id)) {
                    const current = stats.get(s.club_id)
                    current.totalPoints += Number(s.points || 0)
                }
            })

            // Fetch member counts from profiles
            const { data: profileCounts } = await supabase
                .from('profiles')
                .select('club_id')

            profileCounts?.forEach(p => {
                if (p.club_id && stats.has(p.club_id)) {
                    stats.get(p.club_id).memberCount += 1
                }
            })

            const sorted = Array.from(stats.values())
                .sort((a, b) => b.totalPoints - a.totalPoints)

            setClubRankings(sorted)
        } catch (e) {
            console.error('Fetch error:', e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pt-6 pb-20 space-y-8 bg-[#0A0E17] min-h-screen px-4">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h2 className="text-[28px] font-black italic tracking-tighter text-white uppercase leading-none">
                    Club <span className="text-[#CCFF00]">Leaderboard</span>
                </h2>
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
                    전체 클럽 종합 성적 순위
                </p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white/5 rounded-3xl border border-white/5 animate-pulse" />
                    ))}
                </div>
            ) : clubRankings.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-white/20 font-bold">아직 등록된 클럽 랭킹이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-4 pb-10">
                    <AnimatePresence mode="popLayout">
                        {clubRankings.map((club, index) => (
                            <motion.div
                                key={club.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ClubRankCard
                                    rank={index + 1}
                                    club={club}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}

function ClubRankCard({ rank, club }: { rank: number; club: any }) {
    const isTop3 = rank <= 3
    const rankColors: any = {
        1: 'from-[#CCFF00] to-[#88FF00]',
        2: 'from-gray-300 to-gray-500',
        3: 'from-orange-400 to-orange-700',
    }

    return (
        <div className="relative w-full rounded-[32px] overflow-hidden bg-[#121826] border border-white/5 shadow-2xl transition-all hover:border-[#CCFF00]/30 group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

            <div className="relative p-6 flex items-center gap-5">
                {/* Rank Badge */}
                <div className="flex flex-col items-center justify-center min-w-[40px]">
                    {isTop3 ? (
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${rankColors[rank]} flex items-center justify-center shadow-lg`}>
                            <span className="text-black font-black italic text-[18px]">{rank}</span>
                        </div>
                    ) : (
                        <span className="text-white/20 font-black italic text-[20px]">{rank}</span>
                    )}
                </div>

                {/* Club Logo */}
                <div className="w-16 h-16 rounded-2xl bg-[#0A0E17] border border-white/10 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                    {club.logo_url ? (
                        <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                    ) : (
                        <Users size={32} className="text-white/10" />
                    )}
                </div>

                {/* Club Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[18px] font-black text-white tracking-tight truncate">{club.name}</h3>
                        <span className="text-[9px] font-black bg-[#CCFF00]/20 text-[#CCFF00] px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            {club.level || 'MID'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-white/30">
                        <span className="flex items-center gap-1">
                            <Users size={12} /> {club.memberCount} MEMBERS
                        </span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="flex items-center gap-1">
                            <Star size={12} className="text-[#CCFF00]" /> ACTIVE CLUB
                        </span>
                    </div>
                </div>

                {/* Score Section */}
                <div className="text-right">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Total Score</p>
                    <div className="flex flex-col items-end">
                        <span className={`text-[24px] font-black italic leading-none tracking-tighter ${isTop3 ? 'text-[#CCFF00]' : 'text-white'}`}>
                            {Number(club.totalPoints).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-[#CCFF00]/60 italic mt-1">PTS</span>
                    </div>
                </div>
            </div>

            {/* Hover Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
        </div>
    )
}
