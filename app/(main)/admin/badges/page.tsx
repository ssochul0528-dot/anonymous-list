'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Trophy, Award, User, Search, Trash2, ArrowLeft } from 'lucide-react'

const BADGE_TYPES = [
    { id: 'tournament_winner', label: '그랜드슬램 우승 (Trophy)' },
    { id: 'tournament_runnerup', label: '준우승 은반 (Plate)' },
    { id: 'big_server', label: '빅 서버' },
    { id: 'court_dog', label: '코트 독' },
    { id: 'iron_wall', label: '철벽' },
    { id: 'net_shark', label: '네트 샤크' },
    { id: 'gentleman', label: '매너왕' },
    { id: 'sniper', label: '스나이퍼' },
    { id: 'streak_king', label: '연승 군주' },
]

export default function BadgeManagementPage() {
    const router = useRouter()
    const { profile } = useAuth()
    const [loading, setLoading] = useState(true)
    const [members, setMembers] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [selectedUser, setSelectedUser] = useState<any | null>(null)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        const fetchMembers = async () => {
            if (!profile?.club_id) return
            const supabase = createClient()
            const { data } = await supabase
                .from('club_members')
                .select('*, profiles(*)')
                .eq('club_id', profile.club_id)

            if (data) {
                setMembers(data.map(m => m.profiles))
            }
            setLoading(false)
        }
        fetchMembers()
    }, [profile?.club_id])

    const handleAwardBadge = async (badgeId: string) => {
        if (!selectedUser) return
        setProcessing(true)
        const supabase = createClient()

        try {
            const { data: p } = await supabase.from('profiles').select('badges').eq('id', selectedUser.id).single()
            const newBadges = [...(p?.badges || []), badgeId]
            const { error } = await supabase.from('profiles').update({ badges: newBadges }).eq('id', selectedUser.id)

            if (error) throw error

            // Update local state
            setSelectedUser({ ...selectedUser, badges: newBadges })
            setMembers(members.map(m => m.id === selectedUser.id ? { ...m, badges: newBadges } : m))
            alert(`배지가 성공적으로 부여되었습니다.`)
        } catch (err: any) {
            alert('오류 발생: ' + err.message)
        } finally {
            setProcessing(false)
        }
    }

    const handleRemoveBadge = async (index: number) => {
        if (!selectedUser) return
        if (!confirm('해당 수상 기록을 삭제하시겠습니까?')) return

        setProcessing(true)
        const supabase = createClient()

        try {
            const newBadges = [...selectedUser.badges]
            newBadges.splice(index, 1) // Remove only one instance

            const { error } = await supabase.from('profiles').update({ badges: newBadges }).eq('id', selectedUser.id)
            if (error) throw error

            setSelectedUser({ ...selectedUser, badges: newBadges })
            setMembers(members.map(m => m.id === selectedUser.id ? { ...m, badges: newBadges } : m))
        } catch (err: any) {
            alert('오류 발생: ' + err.message)
        } finally {
            setProcessing(false)
        }
    }

    const filteredMembers = members.filter(m =>
        (m.nickname?.toLowerCase().includes(search.toLowerCase())) ||
        (m.real_name?.toLowerCase().includes(search.toLowerCase()))
    )

    if (loading) return <div className="p-10 text-center">Loading...</div>

    return (
        <div className="pt-2 pb-20 space-y-6 bg-[#F2F4F6] min-h-screen px-4">
            <header className="flex items-center gap-2 pt-4 mb-2">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft size={18} />
                </Button>
                <h2 className="text-[20px] font-bold text-[#191F28] uppercase tracking-tight">Badge Management</h2>
            </header>

            {!selectedUser ? (
                <div className="space-y-4">
                    <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-3">
                        <Search size={20} className="text-[#8B95A1]" />
                        <input
                            type="text"
                            placeholder="멤버 이름 또는 닉네임 검색"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent flex-1 outline-none font-medium text-[#191F28]"
                        />
                    </Card>

                    <div className="space-y-2">
                        {filteredMembers.map((member) => (
                            <Card
                                key={member.id}
                                onClick={() => setSelectedUser(member)}
                                className="p-4 bg-white border-none shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                        {member.photo_url ? <img src={member.photo_url} className="w-full h-full object-cover" /> : <User className="text-gray-300" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#191F28]">{member.nickname || member.real_name}</div>
                                        <div className="text-[12px] text-[#8B95A1]">보유 배지: {member.badges?.length || 0}개</div>
                                    </div>
                                </div>
                                <Award size={20} className="text-[#0064FF]" />
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* User Header */}
                    <Card className="p-6 bg-white border-none shadow-sm flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden">
                            {selectedUser.photo_url ? <img src={selectedUser.photo_url} className="w-full h-full object-cover" /> : <User size={32} className="m-auto mt-4 text-gray-300" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[20px] font-black text-[#191F28]">{selectedUser.nickname || selectedUser.real_name}</h3>
                            <button onClick={() => setSelectedUser(null)} className="text-[12px] font-bold text-[#0064FF] mt-1">멤버 다시 선택</button>
                        </div>
                    </Card>

                    {/* Badge Selection */}
                    <div className="space-y-3">
                        <h4 className="text-[14px] font-bold text-[#4E5968] ml-1 uppercase tracking-wider">부여할 배지 선택</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {BADGE_TYPES.map(badge => (
                                <button
                                    key={badge.id}
                                    disabled={processing}
                                    onClick={() => handleAwardBadge(badge.id)}
                                    className="p-4 bg-white rounded-2xl shadow-sm text-left flex items-center justify-between hover:border-[#0064FF] border-2 border-transparent transition-all"
                                >
                                    <span className="font-bold text-[#333D4B]">{badge.label}</span>
                                    <Award size={18} className="text-[#0064FF]" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Current Badges List */}
                    <div className="space-y-3 pt-6 border-t border-gray-200">
                        <h4 className="text-[14px] font-bold text-[#4E5968] ml-1 uppercase tracking-wider">현재 보유 배지 (삭제 가능)</h4>
                        {selectedUser.badges && selectedUser.badges.length > 0 ? (
                            <div className="space-y-2">
                                {selectedUser.badges.map((bId: string, idx: number) => {
                                    const type = BADGE_TYPES.find(t => t.id === bId) || { label: bId }
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <Trophy size={16} className="text-amber-500" />
                                                <span className="text-[14px] font-bold text-[#4E5968]">{type.label}</span>
                                            </div>
                                            <button onClick={() => handleRemoveBadge(idx)} className="text-red-400 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-center py-10 text-gray-400 text-[13px]">보유한 배지가 없습니다.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
