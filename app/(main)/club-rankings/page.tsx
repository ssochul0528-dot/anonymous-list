
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, Star, Award, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function ClubRankingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [clubRankings, setClubRankings] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [debugInfo, setDebugInfo] = useState<any>(null)

    useEffect(() => {
        fetchClubRankings()
    }, [])

    const fetchClubRankings = async () => {
        setLoading(true)
        setError(null)
        const supabase = createClient()
        try {
            console.log('Fetching club rankings...')

            // 1. Fetch all Clubs
            const { data: clubs, error: cError } = await supabase
                .from('clubs')
                .select('*')

            if (cError) throw cError
            setDebugInfo(prev => ({ ...prev, clubsCount: clubs?.length }))

            if (!clubs || clubs.length === 0) {
                setClubRankings([])
                return
            }

            // 2. Fetch all Scores
            const { data: scores, error: sError } = await supabase
                .from('scores')
                .select('points, club_id')

            if (sError) console.error('Scores fetch error:', sError)
            setDebugInfo(prev => ({ ...prev, scoresCount: scores?.length }))

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
            const { data: profileCounts, error: pError } = await supabase
                .from('profiles')
                .select('club_id')

            if (pError) console.error('Profiles fetch error:', pError)
            setDebugInfo(prev => ({ ...prev, profilesCount: profileCounts?.length }))

            profileCounts?.forEach(p => {
                if (p.club_id && stats.has(p.club_id)) {
                    stats.get(p.club_id).memberCount += 1
                }
            })

            const sorted = Array.from(stats.values())
                .sort((a, b) => b.totalPoints - a.totalPoints)

            setClubRankings(sorted)
        } catch (e: any) {
            console.error('Fetch error:', e)
            setError(e.message || '데이터를 불러오는 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pt-6 pb-20 space-y-8 bg-[#0A0E17] min-h-screen px-4">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-[28px] font-black italic tracking-tighter text-white uppercase leading-none">
                        Club <span className="text-[#CCFF00]">Leaderboard</span>
                    </h2>
                    <button
                        onClick={() => fetchClubRankings()}
                        className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white"
                        title="새로고침"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
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
            ) : error ? (
                <div className="text-center py-20 bg-red-500/10 rounded-3xl border border-red-500/20 p-6">
                    <p className="text-red-500 font-bold mb-4">{error}</p>
                    <Button onClick={() => fetchClubRankings()} variant="outline" size="sm">다시 시도하기</Button>
                </div>
            ) : clubRankings.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                    <p className="text-white/20 font-bold text-lg">아직 등록된 클럽 랭킹이 없습니다.</p>
                    <div className="bg-white/5 p-4 rounded-xl text-[10px] text-white/40 font-mono text-left max-w-xs">
                        DEBUG_INFO:<br />
                        CLUBS: {debugInfo?.clubsCount || 0}<br />
                        SCORES: {debugInfo?.scoresCount || 0}<br />
                        PROFILES: {debugInfo?.profilesCount || 0}
                    </div>
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
        <div className="relative w-full rounded-[30px] overflow-hidden bg-[#121826] border border-white/5 shadow-2xl transition-all hover:border-[#CCFF00]/30 group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

            <div className="relative p-5 flex items-center gap-4">
                {/* Rank Badge */}
                <div className="flex flex-col items-center justify-center min-w-[32px]">
                    {isTop3 ? (
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rankColors[rank]} flex items-center justify-center shadow-lg`}>
                            <span className="text-black font-black italic text-[14px]">{rank}</span>
                        </div>
                    ) : (
                        <span className="text-white/20 font-black italic text-[16px]">{rank}</span>
                    )}
                </div>

                {/* Club Logo */}
                <div className="w-12 h-12 rounded-xl bg-[#0A0E17] border border-white/10 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform shrink-0">
                    {club.logo_url ? (
                        <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                    ) : (
                        <Users size={24} className="text-white/10" />
                    )}
                </div>

                {/* Club Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[16px] font-black text-white tracking-tight truncate uppercase italic">{club.name}</h3>
                        <span className="text-[8px] font-black bg-[#CCFF00]/20 text-[#CCFF00] px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            {club.level || 'MID'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/30">
                        <span className="flex items-center gap-1">
                            <Users size={10} /> {club.memberCount} MBRS
                        </span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="flex items-center gap-1">
                            <Star size={10} className="text-[#CCFF00]" /> {club.region?.split(' ')?.[0] || 'ACTIVE'}
                        </span>
                    </div>
                </div>

                {/* Score Section */}
                <div className="text-right shrink-0">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-0.5">Total</p>
                    <div className="flex flex-col items-end">
                        <span className={`text-[20px] font-black italic leading-none tracking-tighter ${isTop3 ? 'text-[#CCFF00]' : 'text-white'}`}>
                            {Number(club.totalPoints).toLocaleString()}
                        </span>
                        <span className="text-[8px] font-black text-[#CCFF00]/60 italic">PTS</span>
                    </div>
                </div>
            </div>

            {/* Hover Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
        </div>
    )
}
