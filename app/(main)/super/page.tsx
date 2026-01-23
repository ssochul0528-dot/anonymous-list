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
            const { data, error } = await supabase
                .from('clubs')
                .select(`
                    *,
                    owner:owner_id (
                        nickname,
                        email,
                        real_name
                    )
                `)
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false })

            if (data) {
                setClubs(data)
            }
            setLoading(false)
        }

        fetchClubs()
    }, [user])

    const handleApprove = async (clubId: string, ownerId: string) => {
        if (!confirm('정말 이 클럽을 승인하시겠습니까?')) return

        const supabase = createClient()

        try {
            // 1. Update Club Status
            const { error: clubError } = await supabase
                .from('clubs')
                .update({ status: 'ACTIVE' })
                .eq('id', clubId)

            if (clubError) throw clubError

            // 2. Update Owner Profile (Role -> PRESIDENT, club_id -> clubId)
            // Note: This overrides their current club. 
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    role: 'PRESIDENT',
                    club_id: clubId
                })
                .eq('id', ownerId)

            if (profileError) throw profileError

            // 3. Add to club_members (New Multi-Club Support)
            const { error: memberError } = await supabase
                .from('club_members')
                .insert({
                    user_id: ownerId,
                    club_id: clubId,
                    role: 'PRESIDENT'
                })

            if (memberError) throw memberError

            if (false) { // dummy check to keep structure consistent if needed, but throwing above handles it

                if (profileError) {
                    console.error("Profile update failed", profileError)
                    alert('클럽은 승인되었으나 프로필 업데이트에 실패했습니다.')
                } else {
                    alert('클럽 승인이 완료되었습니다.')
                    // Remove from list
                    setClubs(prev => prev.filter(c => c.id !== clubId))
                }

            } catch (e: any) {
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

        if (loading) return <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center text-white/30">Loading...</div>

        return (
            <div className="min-h-screen bg-[#0A0E17] text-white p-6 pb-24">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-[24px] font-black italic">SUPER <span className="text-[#CCFF00]">MASTER</span></h1>
                        <p className="text-[12px] text-white/40 font-bold">클럽 개설 신청 관리</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                        EXIT
                    </Button>
                </header>

                {clubs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-white/20 border border-white/5 rounded-[32px] bg-[#121826]">
                        <p className="font-bold">대기 중인 신청이 없습니다.</p>
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
            </div>
        )
    }
