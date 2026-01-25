'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Clock, Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ClubSettingsPage() {
    const { user, isStaff, profile, isLoading } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    const [club, setClub] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Club Info States
    const [clubName, setClubName] = useState('')
    const [region, setRegion] = useState('')
    const [description, setDescription] = useState('')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [clubLevel, setClubLevel] = useState('MID')
    const [inviteCode, setInviteCode] = useState('')

    const [timeSlots, setTimeSlots] = useState<string[]>([])
    const [newTime, setNewTime] = useState('09:00')

    // Auth Check
    useEffect(() => {
        if (!isLoading && !isStaff) {
            alert('운영진만 접근할 수 있습니다.')
            router.replace('/')
        }
    }, [isStaff, isLoading, router])

    // Fetch Club Data
    useEffect(() => {
        const fetchClub = async () => {
            if (profile?.club_id) {
                const { data, error } = await supabase
                    .from('clubs')
                    .select('*')
                    .eq('id', profile.club_id)
                    .single()

                if (data) {
                    setClub(data)
                    setClubName(data.name || '')
                    setRegion(data.region || '')
                    setDescription(data.description || '')
                    setLogoUrl(data.logo_url || null)
                    setClubLevel(data.level || 'MID')
                    setInviteCode(data.invite_code || '')

                    // Parse attendance_options if exists, else default
                    let options = ['08:00', '09:00'] // Fallback
                    if (data.attendance_options) {
                        if (typeof data.attendance_options === 'string') {
                            try {
                                options = JSON.parse(data.attendance_options)
                            } catch (e) { }
                        } else if (Array.isArray(data.attendance_options)) {
                            options = data.attendance_options
                        }
                    }
                    setTimeSlots(options)
                }
                setLoading(false)
            }
        }
        if (profile?.club_id) fetchClub()
    }, [profile?.club_id])

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setSaving(true)
            if (!event.target.files || event.target.files.length === 0) return
            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `club-${club.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setLogoUrl(publicUrl)
        } catch (error: any) {
            alert('로고 업로드 실패: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleRegenerateInvite = () => {
        const newCode = Math.random().toString(36).substring(2, 10).toUpperCase()
        setInviteCode(newCode)
    }

    const handleAddTime = () => {
        if (!newTime) return
        if (timeSlots.includes(newTime)) {
            alert('이미 존재하는 시간입니다.')
            return
        }
        // Sort slots properly
        const newSlots = [...timeSlots, newTime].sort()
        setTimeSlots(newSlots)
        // setNewTime('') // Keep last input or clear? Clear is better but let's keep it easy to add similar
    }

    const handleDeleteTime = (timeParam: string) => {
        if (confirm(`${timeParam} 시간을 삭제하시겠습니까?`)) {
            setTimeSlots(timeSlots.filter(t => t !== timeParam))
        }
    }

    const handleSave = async () => {
        if (!club) return
        setSaving(true)

        const { error } = await supabase
            .from('clubs')
            .update({
                name: clubName,
                region,
                description,
                logo_url: logoUrl,
                level: clubLevel,
                invite_code: inviteCode,
                attendance_options: timeSlots
            })
            .eq('id', club.id)

        if (error) {
            console.error(error)
            alert('저장 실패: ' + error.message)
        } else {
            alert('설정이 저장되었습니다!')
            router.push('/settlement') // Go back to management hub
        }
        setSaving(false)
    }

    if (loading) return <div className="p-10 text-center text-white/50">로딩중...</div>

    return (
        <div className="pb-20 space-y-6 pt-4 px-1">
            <header className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2">
                    <Link href="/" className="p-2 -ml-2 text-white/60 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h2 className="text-[22px] font-black tracking-tight text-white uppercase italic">Club Settings</h2>
                </div>
                <p className="text-white/40 text-[14px] font-medium">클럽 운영 설정을 변경할 수 있습니다.</p>
            </header>

            {/* Club Profile & Showcase */}
            <Card className="bg-[#121826] border-white/5 p-5 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-[16px]">클럽 프로필 설정</h3>
                        <p className="text-white/40 text-[12px]">대시보드와 홍보 페이지에 표시될 정보입니다.</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Club Logo</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[24px] font-black text-white/10 italic">?</span>
                                )}
                            </div>
                            <label className="flex-1">
                                <span className="inline-block px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[12px] font-bold text-white cursor-pointer hover:bg-white/10">
                                    {saving ? 'UPLOADING...' : 'CHANGE LOGO'}
                                </span>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={saving} />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Club Name</label>
                        <input
                            type="text"
                            value={clubName}
                            onChange={(e) => setClubName(e.target.value)}
                            className="w-full p-4 bg-white/5 rounded-xl border border-white/5 text-white outline-none focus:border-[#CCFF00]/50"
                            placeholder="클럽 이름"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Region</label>
                            <input
                                type="text"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="w-full p-4 bg-white/5 rounded-xl border border-white/5 text-white outline-none focus:border-[#CCFF00]/50"
                                placeholder="활동 지역"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Club Level</label>
                            <select
                                value={clubLevel}
                                onChange={(e) => setClubLevel(e.target.value)}
                                className="w-full p-4 bg-white/5 rounded-xl border border-white/5 text-white outline-none focus:border-[#CCFF00]/50 appearance-none font-bold"
                            >
                                <option value="ENTRY" className="bg-[#121826]">ENTRY (초보)</option>
                                <option value="MID" className="bg-[#121826]">MID (중급)</option>
                                <option value="HIGH" className="bg-[#121826]">HIGH (상급)</option>
                                <option value="PRO" className="bg-[#121826]">PRO (선수급)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full p-4 bg-white/5 rounded-xl border border-white/5 text-white outline-none focus:border-[#CCFF00]/50 resize-none text-[14px]"
                            placeholder="클럽에 대한 설명을 적어주세요."
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Invite Code</label>
                        <div className="flex gap-2 mt-1">
                            <div className="flex-1 p-4 bg-black/40 rounded-xl border border-white/5 text-[#CCFF00] font-mono font-bold text-center tracking-widest">
                                {inviteCode}
                            </div>
                            <button
                                onClick={handleRegenerateInvite}
                                className="px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"
                                title="코드 재생성"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                            </button>
                        </div>
                        <p className="text-[10px] text-white/20 mt-2 ml-1">초대 코드가 변경되면 기존 공유된 링크로는 가입이 불가할 수 있습니다.</p>
                    </div>

                    {/* Quick Save for Profile */}
                    <div className="pt-2">
                        <Button
                            fullWidth
                            onClick={handleSave}
                            isLoading={saving}
                            className="bg-[#CCFF00] text-black font-black"
                        >
                            <Save size={18} className="mr-2" />
                            프로필 정보 저장하기
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="bg-[#121826] border-white/5 p-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00]">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-[16px]">출석 시간 설정</h3>
                        <p className="text-white/40 text-[12px]">멤버들이 선택할 수 있는 시간 옵션입니다.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* List */}
                    <div className="grid grid-cols-2 gap-3">
                        {timeSlots.map((time, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-white font-mono font-bold text-[16px]">{time}</span>
                                <button
                                    onClick={() => handleDeleteTime(time)}
                                    className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add New */}
                    <div className="flex gap-2 pt-4 border-t border-white/5 mt-4">
                        <input
                            type="time"
                            className="flex-1 bg-black/40 border-none rounded-xl text-white px-4 py-3 font-mono font-bold outline-none ring-1 ring-white/10 focus:ring-[#CCFF00]"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                        />
                        <button
                            onClick={handleAddTime}
                            className="bg-[#CCFF00] text-black w-14 rounded-xl flex items-center justify-center hover:bg-[#b3e600] active:scale-95 transition-all"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </div>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0E17] to-transparent pb-safe z-20 max-w-[600px] mx-auto flex flex-col gap-2">
                <Button
                    fullWidth
                    size="lg"
                    onClick={handleSave}
                    isLoading={saving}
                    className="h-14 text-[16px] shadow-2xl shadow-[#CCFF00]/20 bg-[#CCFF00] text-black font-black"
                >
                    <Save size={18} className="mr-2" />
                    전체 설정 완료 및 저장
                </Button>
                <p className="text-[10px] text-center text-white/10 uppercase tracking-widest">
                    V.1.0.8-STABLE • AUTO_SYNC_ENABLED
                </p>
            </div>
        </div>
    )
}
