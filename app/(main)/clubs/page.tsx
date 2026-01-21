'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function ClubsListPage() {
    const router = useRouter()
    const [clubs, setClubs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchClubs = async () => {
            const supabase = createClient()

            // Fetch Active Clubs
            const { data, error } = await supabase
                .from('clubs')
                .select('id, name, slug, region, description, logo_url, created_at')
                .eq('status', 'ACTIVE')
                .order('created_at', { ascending: false })

            if (data) {
                // Determine "New" status (e.g. created within 7 days)
                const now = new Date()
                const enhancedData = data.map(club => {
                    const created = new Date(club.created_at)
                    const diffTime = Math.abs(now.getTime() - created.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    return { ...club, isNew: diffDays <= 7 }
                })
                setClubs(enhancedData)
            }
            setLoading(false)
        }

        fetchClubs()
    }, [])

    return (
        <div className="min-h-screen bg-[#0A0E17] text-white pb-24">
            {/* Header */}
            <header className="px-6 py-8 border-b border-white/5 bg-[#121826]/50 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-[24px] font-black italic tracking-tighter uppercase">
                        CLUB <span className="text-[#CCFF00]">MARKET</span>
                    </h1>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/40 hover:text-white"
                        onClick={() => router.back()}
                    >
                        CLOSE
                    </Button>
                </div>
                <p className="text-[13px] text-white/60 font-medium">당신에게 딱 맞는 클럽을 찾아보세요</p>
            </header>

            <main className="p-6">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-white/5 rounded-[24px] animate-pulse" />
                        ))}
                    </div>
                ) : clubs.length === 0 ? (
                    <div className="text-center py-20 text-white/20">
                        <p className="font-bold">등록된 클럽이 없습니다.</p>
                    </div>
                ) : (
                    <div className="grid gap-5">
                        {clubs.map((club, idx) => (
                            <motion.div
                                key={club.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card
                                    className="bg-[#121826] border border-white/5 p-5 relative overflow-hidden group cursor-pointer hover:border-[#CCFF00]/30 transition-all active:scale-[0.98]"
                                    onClick={() => router.push(`/clubs/${club.slug}`)}
                                >
                                    {/* Hover Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#CCFF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative z-10 flex items-start gap-4">
                                        {/* Logo */}
                                        <div className="w-16 h-16 rounded-[20px] bg-[#0A0E17] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                            {club.logo_url ? (
                                                <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[20px] font-black italic text-white/20">{club.name[0]}</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-[18px] font-bold text-white truncate pr-2">{club.name}</h3>
                                                {club.isNew && (
                                                    <span className="px-2 py-0.5 bg-[#CCFF00] text-black text-[10px] font-black rounded-full">NEW</span>
                                                )}
                                            </div>
                                            <p className="text-[12px] text-white/40 font-medium mb-3">{club.region}</p>

                                            {/* Tags (Mock for now, can be real later) */}
                                            <div className="flex gap-2">
                                                <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/40 font-bold">#테니스</span>
                                                <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/40 font-bold">#매너</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                        <p className="text-[12px] text-white/40 line-clamp-1 flex-1 pr-4">
                                            {club.description || "클럽 소개글이 없습니다."}
                                        </p>
                                        <span className="text-[#CCFF00] text-[12px] font-bold shrink-0">입장하기 &gt;</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
