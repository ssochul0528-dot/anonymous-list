
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import PlayerRadarChart from '@/components/PlayerRadarChart'
import SignatureBadges from '@/components/SignatureBadges'
import PlayerCard from '@/components/PlayerCard'

export default function ProfilePage() {
    const { user, isPresident, claimPresident } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isFlipped, setIsFlipped] = useState(false)

    // ... (rest of profile states)

    // Profile State
    const [nickname, setNickname] = useState('')
    const isEligibleForPresident =
        user?.email?.toLowerCase().includes('ssochul') ||
        nickname?.toLowerCase().includes('ssochul')
    const [style, setStyle] = useState('올라운드')
    const [position, setPosition] = useState('무관')
    const [bio, setBio] = useState('')
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)
    const [cardColor, setCardColor] = useState('#D4AF37') // Default Gold
    const [membershipType, setMembershipType] = useState('NONE')
    const [membershipUntil, setMembershipUntil] = useState<string | null>(null)
    const [bankInfo, setBankInfo] = useState('')

    // New Fields
    const [racket, setRacket] = useState('')
    const [stringTension, setStringTension] = useState('')
    const [prefDays, setPrefDays] = useState('무관')
    const [prefSlots, setPrefSlots] = useState('아침')
    const [prefEnv, setPrefEnv] = useState('무관')
    const [prefType, setPrefType] = useState('하드')
    const [prefSide, setPrefSide] = useState('무관')

    // Skill Fields
    const [skillServe, setSkillServe] = useState(50)
    const [skillForehand, setSkillForehand] = useState(50)
    const [skillBackhand, setSkillBackhand] = useState(50)
    const [skillVolley, setSkillVolley] = useState(50)
    const [skillStamina, setSkillStamina] = useState(50)
    const [skillManner, setSkillManner] = useState(50)

    // Badge Logic
    const getActiveBadges = () => {
        const badges = []
        if (skillServe >= 80) badges.push('big_server')
        if (skillStamina >= 80) badges.push('court_dog')
        if (style === '수비' && skillStamina >= 70) badges.push('iron_wall')
        if ((position === '전위(네트)' || position === '무관') && skillVolley >= 75) badges.push('net_shark')
        if (skillManner >= 90) badges.push('gentleman')
        if (skillForehand >= 85 || skillBackhand >= 85) badges.push('sniper')
        if (skillServe >= 70 && skillForehand >= 70 && skillBackhand >= 70) badges.push('streak_king') // Placeholder logic
        return badges
    }

    useEffect(() => {
        if (user) {
            fetchProfile()
        }
    }, [user])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single()

            if (data) {
                setNickname(data.nickname || '')
                setStyle(data.style || '올라운드')
                setPosition(data.position || '무관')
                setBio(data.bio || '')
                setPhotoUrl(data.photo_url || null)
                setCardColor(data.color || '#D4AF37')
                setRacket(data.racket || '')
                setStringTension(data.string_tension || '')
                setPrefDays(data.pref_time_days || '무관')
                setPrefSlots(data.pref_time_slots || '아침')
                setPrefEnv(data.pref_court_env || '무관')
                setPrefType(data.pref_court_type || '하드')
                setPrefSide(data.pref_side || '무관')
                setSkillServe(data.skill_serve || 50)
                setSkillForehand(data.skill_forehand || 50)
                setSkillBackhand(data.skill_backhand || 50)
                setSkillVolley(data.skill_volley || 50)
                setSkillStamina(data.skill_stamina || 50)
                setSkillManner(data.skill_manner || 50)
                setMembershipType(data.membership_type || 'NONE')
                setMembershipUntil(data.membership_until || null)
                setBankInfo(data.bank_info || '')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setLoading(true)
            if (!event.target.files || event.target.files.length === 0) {
                return
            }
            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setPhotoUrl(publicUrl)
        } catch (error: any) {
            alert('이미지 업로드 실패: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const updateProfile = async () => {
        try {
            setLoading(true)
            const updates = {
                id: user?.id,
                nickname,
                style,
                position,
                bio,
                photo_url: photoUrl,
                color: cardColor,
                racket,
                string_tension: stringTension,
                pref_time_days: prefDays,
                pref_time_slots: prefSlots,
                pref_court_env: prefEnv,
                pref_court_type: prefType,
                pref_side: prefSide,
                skill_serve: skillServe,
                skill_forehand: skillForehand,
                skill_backhand: skillBackhand,
                skill_volley: skillVolley,
                skill_stamina: skillStamina,
                skill_manner: skillManner,
                membership_type: membershipType,
                membership_until: membershipUntil,
                bank_info: bankInfo,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabase.from('profiles').upsert(updates)
            if (error) throw error
            alert('프로필이 저장되었습니다.')
            router.refresh()
        } catch (error) {
            alert('프로필 저장 실패')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="pt-2 pb-20 space-y-6">
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        &lt; 뒤로
                    </Button>
                    <h2 className="text-[20px] font-bold">선수 카드 수정</h2>
                </div>
                {isEligibleForPresident && !isPresident && (
                    <Button
                        size="sm"
                        onClick={claimPresident}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold animate-bounce"
                    >
                        회장 권한 활성화
                    </Button>
                )}
            </div>

            {/* Game Card Preview with 3D Flip */}
            <div className="flex justify-center mb-8">
                <PlayerCard profile={{
                    nickname,
                    style,
                    position,
                    bio,
                    photo_url: photoUrl,
                    color: cardColor,
                    racket,
                    skill_serve: skillServe,
                    skill_forehand: skillForehand,
                    skill_backhand: skillBackhand,
                    skill_volley: skillVolley,
                    skill_stamina: skillStamina,
                    skill_manner: skillManner,
                    pref_time_days: prefDays,
                    pref_time_slots: prefSlots,
                    pref_side: prefSide
                }} />
            </div>

            <Card className="space-y-8 p-6 md:p-8">
                {/* Skill Evolution */}
                <div className="space-y-6">
                    <h3 className="font-bold text-[16px] flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#CCFF00] rounded-full" />
                        능력치 (Abilities)
                    </h3>

                    <div className="grid gap-6">
                        <SkillSlider label="서브 (Serve)" value={skillServe} onChange={setSkillServe} color="#00D1FF" />
                        <SkillSlider label="포핸드 (Forehand)" value={skillForehand} onChange={setSkillForehand} color="#CCFF00" />
                        <SkillSlider label="백핸드 (Backhand)" value={skillBackhand} onChange={setSkillBackhand} color="#00D1FF" />
                        <SkillSlider label="발리 (Volley)" value={skillVolley} onChange={setSkillVolley} color="#CCFF00" />
                        <SkillSlider label="체력 (Stamina)" value={skillStamina} onChange={setSkillStamina} color="#00D1FF" />
                        <SkillSlider label="매너 (Manner)" value={skillManner} onChange={setSkillManner} color="#CCFF00" />
                    </div>
                </div>

                {/* Signature Badges Preview */}
                <div className="space-y-4">
                    <h3 className="font-bold text-[16px] flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#FFD700] rounded-full" />
                        획득한 시그니처 배지
                    </h3>
                    <div className="bg-[#F2F4F6] p-4 rounded-[20px] min-h-[80px] flex items-center justify-center">
                        {getActiveBadges().length > 0 ? (
                            <SignatureBadges activeBadgeIds={getActiveBadges()} />
                        ) : (
                            <p className="text-[13px] text-[#8B95A1] font-medium">능력치를 올려 배지를 획득해보세요!</p>
                        )}
                    </div>
                </div>

                {/* Visual Settings */}
                <div className="space-y-4">
                    <h3 className="font-bold text-[16px] flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#0064FF] rounded-full" />
                        카드 커스텀
                    </h3>
                    <div>
                        <label className="block text-[13px] font-bold text-[#4E5968] mb-3">테마 색상</label>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {['#D4AF37', '#E53E3E', '#3182CE', '#38A169', '#805AD5', '#FAAD14', '#191F28'].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCardColor(c)}
                                    className={`w-10 h-10 rounded-full flex-shrink-0 transition-all ${cardColor === c ? 'ring-2 ring-offset-2 ring-[#0064FF] scale-110' : 'opacity-80 hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-4">
                    <h3 className="font-bold text-[16px] flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#0064FF] rounded-full" />
                        선수 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">닉네임 (필수-v2)</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full p-4 bg-[#F2F4F6] rounded-[16px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none transition-all font-medium"
                                placeholder="코트 위 별명"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">프로필 사진</label>
                            <div className="flex items-center gap-3">
                                <label className="flex-1 p-4 bg-[#F2F4F6] rounded-[16px] border-none text-[14px] font-bold text-center cursor-pointer hover:bg-gray-200 transition-colors">
                                    사진 선택하기
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                    {/* 선호 사이드 선택 섹션 - 상단 이동 */}
                    <div className="bg-[#E6F7FF] p-4 rounded-[16px] border-2 border-[#00D1FF]/30">
                        <label className="block text-[13px] font-bold text-[#0064FF] mb-2">🏸 최우선: 선호 코트 사이드 (포/백)</label>
                        <div className="flex gap-2">
                            {['포사이드', '백사이드', '무관'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setPrefSide(s)}
                                    className={`flex-1 py-4 rounded-[16px] text-[14px] font-bold transition-all ${prefSide === s ? 'bg-[#00D1FF] text-white shadow-lg' : 'bg-white text-[#6B7684]'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[13px] font-bold text-[#4E5968] mb-2">플레이 스타일</label>
                        <div className="flex gap-2">
                            {['공격', '수비', '올라운드'].map((s) => (
                                <button key={s} onClick={() => setStyle(s)} className={`flex-1 py-4 rounded-[16px] text-[14px] font-bold transition-all ${style === s ? 'bg-[#0064FF] text-white shadow-lg shadow-blue-500/20' : 'bg-[#F2F4F6] text-[#6B7684]'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[13px] font-bold text-[#4E5968] mb-2">선호 포지션</label>
                        <div className="flex gap-2">
                            {['전위(네트)', '후위(베이스)', '무관'].map((p) => (
                                <button key={p} onClick={() => setPosition(p)} className={`flex-1 py-4 rounded-[16px] text-[14px] font-bold transition-all ${position === p ? 'bg-[#333D4B] text-white' : 'bg-[#F2F4F6] text-[#6B7684]'}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Equipment */}
                <div className="space-y-4">
                    <h3 className="font-bold text-[16px] flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#0064FF] rounded-full" />
                        장비 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">사용 라켓</label>
                            <input
                                type="text"
                                value={racket}
                                onChange={(e) => setRacket(e.target.value)}
                                className="w-full p-4 bg-[#F2F4F6] rounded-[16px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none transition-all font-medium"
                                placeholder="예: 바볼랏 퓨어에어로"
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">스트링 / 텐션</label>
                            <input
                                type="text"
                                value={stringTension}
                                onChange={(e) => setStringTension(e.target.value)}
                                className="w-full p-4 bg-[#F2F4F6] rounded-[16px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none transition-all font-medium"
                                placeholder="예: 알루파워 48lbs"
                            />
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                    <h3 className="font-bold text-[16px] flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#0064FF] rounded-full" />
                        선호 환경
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">요일</label>
                            <select value={prefDays} onChange={(e) => setPrefDays(e.target.value)} className="w-full p-4 bg-[#F2F4F6] rounded-[16px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none font-bold">
                                {['주말', '평일', '무관'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">시간대</label>
                            <select value={prefSlots} onChange={(e) => setPrefSlots(e.target.value)} className="w-full p-4 bg-[#F2F4F6] rounded-[16px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none font-bold">
                                {['아침', '점심', '저녁'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">실내/실외</label>
                            <select value={prefEnv} onChange={(e) => setPrefEnv(e.target.value)} className="w-full p-4 bg-[#F2F4F6] rounded-[16px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none font-bold">
                                {['실내', '실외', '무관'].map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">코트 종류</label>
                            <select value={prefType} onChange={(e) => setPrefType(e.target.value)} className="w-full p-4 bg-[#F2F4F6] rounded-[16px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none font-bold">
                                {['하드', '클레이', '인조잔디'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Membership Status (Read Only for non-admin, or semi-editable) */}
                <div className="space-y-4">
                    <h3 className="font-bold text-[16px] flex items-center gap-2">
                        <span className="w-1 h-4 bg-purple-500 rounded-full" />
                        클럽 멤버십
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">회비 납부 방식</label>
                            <select value={membershipType} onChange={(e) => setMembershipType(e.target.value)} className="w-full p-4 bg-[#F2F4F6] rounded-[16px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none font-bold">
                                <option value="NONE">가입 안함</option>
                                <option value="MONTHLY">월납 회원</option>
                                <option value="ANNUAL">연납 회원</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">멤버십 만료일</label>
                            <input
                                type="date"
                                value={membershipUntil || ''}
                                onChange={(e) => setMembershipUntil(e.target.value)}
                                className="w-full p-4 bg-[#F2F4F6] rounded-[16px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Account Info (Admin only for display, but users can set their own if they are a leader) */}
                <div className="space-y-4">
                    <h3 className="font-bold text-[16px] flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-500 rounded-full" />
                        정산 계좌 정보
                    </h3>
                    <div>
                        <label className="block text-[13px] font-bold text-[#4E5968] mb-2">입금 받을 계좌 (총무/관리자용)</label>
                        <input
                            type="text"
                            value={bankInfo}
                            onChange={(e) => setBankInfo(e.target.value)}
                            className="w-full p-4 bg-[#F2F4F6] rounded-[16px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none transition-all font-medium"
                            placeholder="예: 카카오뱅크 3333-01-234567 홍길동"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button fullWidth size="lg" onClick={updateProfile} disabled={loading} className="h-16 text-[18px] font-black rounded-[20px] shadow-xl shadow-blue-500/20">
                        {loading ? '저장 중...' : '프로필 완성하기'}
                    </Button>
                </div>
            </Card>
        </div>
    )
}

function SkillSlider({ label, value, onChange, color }: any) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#4E5968]">{label}</span>
                <span className="text-[15px] font-black" style={{ color }}>{value}</span>
            </div>
            <div className="relative flex items-center">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#F2F4F6] rounded-lg appearance-none cursor-pointer accent-[#0064FF] focus:outline-none"
                    style={{
                        background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, #F2F4F6 ${value}%, #F2F4F6 100%)`
                    }}
                />
            </div>
        </div>
    )
}
