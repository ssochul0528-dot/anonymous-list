
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
                <div className="flex gap-2">
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
                    <h3 className="font-black text-[14px] flex items-center gap-2 text-white/40 uppercase tracking-widest italic">
                        <span className="w-1 h-3 bg-[#FFD700] rounded-full shadow-[0_0_8px_#FFD700]" />
                        SIGNATURE BADGES
                    </h3>
                    <div className="bg-white/5 p-5 rounded-[24px] min-h-[100px] flex items-center justify-center border border-white/5 shadow-inner">
                        {getActiveBadges().length > 0 ? (
                            <SignatureBadges activeBadgeIds={getActiveBadges()} />
                        ) : (
                            <p className="text-[13px] text-[#8B95A1] font-medium">능력치를 올려 배지를 획득해보세요!</p>
                        )}
                    </div>
                </div>

                {/* Visual Settings */}
                <div className="space-y-6">
                    <h3 className="font-black text-[14px] flex items-center gap-2 text-white/40 uppercase tracking-widest italic">
                        <span className="w-1 h-3 bg-[#CCFF00] rounded-full shadow-[0_0_8px_#CCFF00]" />
                        VISUAL CUSTOM
                    </h3>
                    <div>
                        <label className="block text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">Card Theme Color</label>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {['#CCFF00', '#00D1FF', '#D4AF37', '#E53E3E', '#805AD5', '#FFFFFF', '#191F28'].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCardColor(c)}
                                    className={`w-12 h-12 rounded-full flex-shrink-0 transition-all border-2 ${cardColor === c ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-6">
                    <h3 className="font-black text-[14px] flex items-center gap-2 text-white/40 uppercase tracking-widest italic">
                        <span className="w-1 h-3 bg-[#00D1FF] rounded-full shadow-[0_0_8px_#00D1FF]" />
                        PLAYER INFO
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Nickname</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5 text-white focus:border-[#CCFF00]/50 outline-none transition-all font-bold placeholder:text-white/10"
                                placeholder="코트 위 별명"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Profile Image</label>
                            <div className="flex items-center gap-3">
                                <label className="flex-1 p-4 bg-white/5 rounded-[16px] border border-white/5 text-[14px] font-black text-white text-center cursor-pointer hover:bg-white/10 transition-colors italic">
                                    UPLOAD PHOTO
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#CCFF00]/5 p-5 rounded-[24px] border border-[#CCFF00]/20">
                        <label className="block text-[11px] font-black text-[#CCFF00] mb-3 ml-1 uppercase tracking-widest italic">Preferred Court Side</label>
                        <div className="flex gap-2">
                            {['포사이드', '백사이드', '무관'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setPrefSide(s)}
                                    className={`flex-1 py-4 rounded-[16px] text-[14px] font-black transition-all border-2 ${prefSide === s ? 'bg-[#CCFF00] text-[#0A0E17] border-[#CCFF00]' : 'bg-transparent border-white/5 text-white/40 hover:border-white/20'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Play Style</label>
                        <div className="flex gap-2">
                            {['공격', '수비', '올라운드'].map((s) => (
                                <button key={s} onClick={() => setStyle(s)} className={`flex-1 py-4 rounded-[16px] text-[14px] font-black transition-all border-2 ${style === s ? 'bg-white text-[#0A0E17] border-white shadow-lg' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Preferred Position</label>
                        <div className="flex gap-2">
                            {['전위(네트)', '후위(베이스)', '무관'].map((p) => (
                                <button key={p} onClick={() => setPosition(p)} className={`flex-1 py-4 rounded-[16px] text-[14px] font-black transition-all border-2 ${position === p ? 'bg-white text-[#0A0E17] border-white shadow-lg' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="font-black text-[14px] flex items-center gap-2 text-white/40 uppercase tracking-widest italic">
                        <span className="w-1 h-3 bg-[#CCFF00] rounded-full shadow-[0_0_8px_#CCFF00]" />
                        EQUIPMENT
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Racket</label>
                            <input
                                type="text"
                                value={racket}
                                onChange={(e) => setRacket(e.target.value)}
                                className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5 text-white focus:border-[#CCFF00]/50 outline-none transition-all font-bold placeholder:text-white/10"
                                placeholder="예: 바볼랏 퓨어에어로"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">String & Tension</label>
                            <input
                                type="text"
                                value={stringTension}
                                onChange={(e) => setStringTension(e.target.value)}
                                className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5 text-white focus:border-[#CCFF00]/50 outline-none transition-all font-bold placeholder:text-white/10"
                                placeholder="예: 알루파워 48lbs"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="font-black text-[14px] flex items-center gap-2 text-white/40 uppercase tracking-widest italic">
                        <span className="w-1 h-3 bg-[#00D1FF] rounded-full shadow-[0_0_8px_#00D1FF]" />
                        PREFERENCES
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Days</label>
                            <select value={prefDays} onChange={(e) => setPrefDays(e.target.value)} className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5 text-white focus:border-[#CCFF00]/50 outline-none font-bold appearance-none">
                                {['주말', '평일', '무관'].map(d => <option key={d} value={d} className="bg-[#121826]">{d}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Slots</label>
                            <select value={prefSlots} onChange={(e) => setPrefSlots(e.target.value)} className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5 text-white focus:border-[#CCFF00]/50 outline-none font-bold appearance-none">
                                {['아침', '점심', '저녁'].map(s => <option key={s} value={s} className="bg-[#121826]">{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Location</label>
                            <select value={prefEnv} onChange={(e) => setPrefEnv(e.target.value)} className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5 text-white focus:border-[#CCFF00]/50 outline-none font-bold appearance-none">
                                {['실내', '실외', '무관'].map(e => <option key={e} value={e} className="bg-[#121826]">{e}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Surface</label>
                            <select value={prefType} onChange={(e) => setPrefType(e.target.value)} className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5 text-white focus:border-[#CCFF00]/50 outline-none font-bold appearance-none">
                                {['하드', '클레이', '인조잔디'].map(t => <option key={t} value={t} className="bg-[#121826]">{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="font-black text-[14px] flex items-center gap-2 text-white/40 uppercase tracking-widest italic">
                        <span className="w-1 h-3 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                        MEMBERSHIP
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Dues Type</label>
                            <select value={membershipType} onChange={(e) => setMembershipType(e.target.value)} className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5 text-white focus:border-[#CCFF00]/50 outline-none font-bold appearance-none">
                                <option value="NONE" className="bg-[#121826]">가입 안함</option>
                                <option value="MONTHLY" className="bg-[#121826]">월납 회원</option>
                                <option value="ANNUAL" className="bg-[#121826]">연납 회원</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Expiry Date</label>
                            <input
                                type="date"
                                value={membershipUntil || ''}
                                onChange={(e) => setMembershipUntil(e.target.value)}
                                className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5 text-white focus:border-[#CCFF00]/50 outline-none font-bold color-scheme-dark"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="font-black text-[14px] flex items-center gap-2 text-white/40 uppercase tracking-widest italic">
                        <span className="w-1 h-3 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                        SETTLEMENT
                    </h3>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Bank Account</label>
                        <input
                            type="text"
                            value={bankInfo}
                            onChange={(e) => setBankInfo(e.target.value)}
                            className="w-full p-4 bg-white/5 rounded-[16px] border border-white/5 text-white focus:border-[#CCFF00]/50 outline-none transition-all font-bold placeholder:text-white/10"
                            placeholder="예: 카카오뱅크 3333-01-234567 홍길동"
                        />
                    </div>
                </div>

                <div className="pt-8">
                    <Button fullWidth size="lg" onClick={updateProfile} disabled={loading}>
                        {loading ? 'SAVING...' : 'SAVE PLAYER CARD'}
                    </Button>
                </div>
            </Card>
        </div>
    )
}

function SkillSlider({ label, value, onChange, color }: any) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest italic">{label}</span>
                <span className="text-[16px] font-black italic" style={{ color }}>{value}<span className="text-[10px] opacity-30 ml-0.5 ml-1">PT</span></span>
            </div>
            <div className="relative flex items-center">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#CCFF00] focus:outline-none"
                    style={{
                        background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, rgba(255,255,255,0.05) ${value}%, rgba(255,255,255,0.05) 100%)`
                    }}
                />
            </div>
        </div>
    )
}
