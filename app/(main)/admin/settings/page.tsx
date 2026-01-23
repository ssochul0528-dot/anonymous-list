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
                attendance_options: timeSlots
            })
            .eq('id', club.id)

        if (error) {
            console.error(error)
            alert('저장 실패: ' + error.message)
        } else {
            alert('설정이 저장되었습니다!')
            router.refresh()
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

            <Card className="bg-[#121826] border-white/5 p-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00]">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-[16px]">출석 시간 설정</h3>
                        <p className="text-white/40 text-[12px]">멤버들이 선택할 수 있는 시간을 관리하세요.</p>
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

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0E17] to-transparent pb-safe z-20 max-w-[600px] mx-auto">
                <Button
                    fullWidth
                    size="lg"
                    onClick={handleSave}
                    isLoading={saving}
                    className="h-14 text-[16px] shadow-2xl shadow-[#CCFF00]/20"
                >
                    <Save size={18} className="mr-2" />
                    설정 저장하기
                </Button>
            </div>
        </div>
    )
}
