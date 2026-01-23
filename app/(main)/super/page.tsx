'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card' // Assuming this exists or I'll use div style if Card is specific
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'

export default function SuperAdminPage() {
    const { user, isPresident } = useAuth() // using isPresident as proxy for high-level access for now
    const router = useRouter()
    const [clubs, setClubs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Verify Super Admin (Simple check on client, RLS on server)
    // Roadmap says ssochul is the super admin. 
    // We can rely on 'isPresident' + email check or just assume if they access this page they are authorized via RLS 
    // (but good to redirect if obviously not)

    useEffect(() => {
        if (!user) return

        // Fetch PENDING clubs
        const fetchClubs = async () => {
            const supabase = createClient()

            // 1. Pending
            const { data: pendingData } = await supabase
                .from('clubs')
                .select(`*, owner:owner_id(nickname, email, real_name)`)
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false })

            if (pendingData) setClubs(pendingData)

            // 2. Active (Existing Clubs)
            const { data: activeData } = await supabase
                .from('clubs')
                .select(`*, owner:owner_id(nickname, email, real_name)`)
                .eq('status', 'ACTIVE')
                .order('created_at', { ascending: false })

            if (activeData) setActiveClubs(activeData)

            setLoading(false)
        }

        fetchClubs()
    }, [user])

    // State for Active Clubs
    const [activeClubs, setActiveClubs] = useState<any[]>([])

    // Handlers
    const handleApprove = async (clubId: string, ownerId: string) => {
        if (!confirm('정말 이 클럽을 승인하시겠습니까?')) return

        const supabase = createClient()

        try {
            // Use RPC function
            const { data, error } = await supabase.rpc('approve_club_application', {
                p_club_id: clubId,
                p_owner_id: ownerId
            })

            if (error) throw error
            if (data && data.status === 'error') throw new Error(data.message)

            alert('클럽 승인이 완료되었습니다.')
            // Refresh logic: Move from Pending to Active ideally, or just re-fetch. 
            // Simple: Remove from Pending, Add to Active (we need full object though)
            // Let's just remove from Pending and reload page or re-fetch? 
            // Re-fetch is safer but lazy. Let's just remove from pending and alert user to refresh or manually update state.
            // Better: Reload window for full sync
            window.location.reload()

        } catch (e: any) {
            console.error(e)
            alert('오류 발생: ' + e.message)
        }
    }


    const handleReject = async (clubId: string) => {
        if (!confirm('정말 거절하시겠습니까?')) return
        const supabase = createClient()
        const { error } = await supabase.from('clubs').update({ status: 'REJECTED' }).eq('id', clubId)
        if (!error) {
            setClubs(prev => prev.filter(c => c.id !== clubId))
        } else {
            alert('오류 발생')
        }
    }

    const handleDelete = async (clubId: string) => {
        if (!confirm('경고: 정말로 이 클럽을 삭제하시겠습니까? (삭제된 클럽은 복구되지 않을 수 있습니다)')) return

        const supabase = createClient()
        try {
            const { data, error } = await supabase.rpc('delete_club', { p_club_id: clubId })

            if (error) throw error
            if (data?.status === 'error') throw new Error(data.message)

            alert('클럽이 삭제되었습니다.')
            setActiveClubs(prev => prev.filter(c => c.id !== clubId))

        } catch (e: any) {
            console.error(e)
            alert('삭제 실패: ' + e.message)
        }
    }

    if (loading) return <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center text-white/30">Loading...</div>

    return (
        <div className="min-h-screen bg-[#0A0E17] text-white p-6 pb-24">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-[24px] font-black italic">SUPER <span className="text-[#CCFF00]">MASTER</span></h1>
                    <p className="text-[12px] text-white/40 font-bold">클럽 개설 신청 및 관리</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                    EXIT
                </Button>
            </header>

            {/* PENDING CLUBS SECTION */}
            <section className="mb-12">
                <h2 className="text-[18px] font-bold text-white mb-4 uppercase italic flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                    Pending Requests ({clubs.length})
                </h2>

                {clubs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[100px] text-white/20 border border-white/5 rounded-[24px] bg-[#121826]">
                        <p className="font-bold text-[14px]">대기 중인 신청이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {clubs.map(club => (
                            <motion.div
                                key={club.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#121826] p-6 rounded-[24px] border border-white/5 space-y-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        {club.logo_url ? (
                                            <img src={club.logo_url} alt={club.name} className="w-16 h-16 rounded-[20px] object-cover bg-black/20" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-[20px] bg-white/10 flex items-center justify-center text-[24px] font-black italic">
                                                {club.name[0]}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-[18px] font-bold text-white leading-tight">{club.name}</h3>
                                            <p className="text-[12px] text-white/40 font-medium">{club.region}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-bold rounded">신청자: {club.owner?.nickname || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/20 p-4 rounded-xl">
                                    <p className="text-[13px] text-white/70 leading-relaxed whitespace-pre-wrap">{club.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        className="bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-white/40 font-bold h-12"
                                        onClick={() => handleReject(club.id)}
                                    >
                                        REJECT
                                    </Button>
                                    <Button
                                        className="bg-[#CCFF00] hover:bg-[#b3ff00] text-black font-black h-12 shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                                        onClick={() => handleApprove(club.id, club.owner_id)}
                                    >
                                        APPROVE
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* ACTIVE CLUBS SECTION */}
            <section>
                <h2 className="text-[18px] font-bold text-white mb-4 uppercase italic flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00D1FF]" />
                    Active Clubs ({activeClubs.length})
                </h2>

                {activeClubs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[100px] text-white/20 border border-white/5 rounded-[24px] bg-[#121826]">
                        <p className="font-bold text-[14px]">활성화된 클럽이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeClubs.map(club => (
                            <div
                                key={club.id}
                                className="bg-[#121826] p-5 rounded-[24px] border border-white/5 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    {club.logo_url ? (
                                        <img src={club.logo_url} alt={club.name} className="w-12 h-12 rounded-[16px] object-cover bg-black/20" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-[16px] bg-white/10 flex items-center justify-center text-[20px] font-black italic">
                                            {club.name[0]}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-[16px] font-bold text-white">{club.name}</h3>
                                        <p className="text-[11px] text-white/40">MASTER: {club.owner?.nickname || 'Unknown'}</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-white/5 hover:bg-red-500 hover:text-white text-red-500 h-9 px-3 font-bold text-[11px]"
                                    onClick={() => handleDelete(club.id)}
                                >
                                    DELETE
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
