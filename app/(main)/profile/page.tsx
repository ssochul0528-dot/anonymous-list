
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import PlayerRadarChart from '@/components/PlayerRadarChart'

export default function ProfilePage() {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isFlipped, setIsFlipped] = useState(false)

    // Profile State
    const [nickname, setNickname] = useState('')
    const [style, setStyle] = useState('올라운드')
    const [position, setPosition] = useState('무관')
    const [bio, setBio] = useState('')
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)
    const [cardColor, setCardColor] = useState('#D4AF37') // Default Gold

    // New Fields
    const [racket, setRacket] = useState('')
    const [stringTension, setStringTension] = useState('')
    const [prefDays, setPrefDays] = useState('무관')
    const [prefSlots, setPrefSlots] = useState('아침')
    const [prefEnv, setPrefEnv] = useState('무관')
    const [prefType, setPrefType] = useState('하드')

    // Skill Fields
    const [skillServe, setSkillServe] = useState(50)
    const [skillForehand, setSkillForehand] = useState(50)
    const [skillBackhand, setSkillBackhand] = useState(50)
    const [skillVolley, setSkillVolley] = useState(50)
    const [skillStamina, setSkillStamina] = useState(50)
    const [skillManner, setSkillManner] = useState(50)

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
                // setCardColor(data.color || '#D4AF37')
                setRacket(data.racket || '')
                setStringTension(data.string_tension || '')
                setPrefDays(data.pref_time_days || '무관')
                setPrefSlots(data.pref_time_slots || '아침')
                setPrefEnv(data.pref_court_env || '무관')
                setPrefType(data.pref_court_type || '하드')
                setSkillServe(data.skill_serve || 50)
                setSkillForehand(data.skill_forehand || 50)
                setSkillBackhand(data.skill_backhand || 50)
                setSkillVolley(data.skill_volley || 50)
                setSkillStamina(data.skill_stamina || 50)
                setSkillManner(data.skill_manner || 50)
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
                // color: cardColor,
                racket,
                string_tension: stringTension,
                pref_time_days: prefDays,
                pref_time_slots: prefSlots,
                pref_court_env: prefEnv,
                pref_court_type: prefType,
                skill_serve: skillServe,
                skill_forehand: skillForehand,
                skill_backhand: skillBackhand,
                skill_volley: skillVolley,
                skill_stamina: skillStamina,
                skill_manner: skillManner,
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

    // Helper to get initials
    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??'

    return (
        <div className="pt-2 pb-20 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    &lt; 뒤로
                </Button>
                <h2 className="text-[20px] font-bold">선수 카드 수정</h2>
            </div>

            {/* Game Card Preview with 3D Flip */}
            <div className="flex flex-col items-center mb-8 perspective-1000">
                <motion.div
                    className="relative w-[300px] h-[480px] cursor-pointer preserve-3d"
                    onMouseEnter={() => setIsFlipped(true)}
                    onMouseLeave={() => setIsFlipped(false)}
                    onClick={() => setIsFlipped(!isFlipped)}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                >
                    {/* Front Side */}
                    <div className="absolute inset-0 backface-hidden rounded-[24px] overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c20] via-[#0f1012] to-[#000000]" />
                        <div className="absolute inset-[4px] rounded-[20px] border-2 bg-gradient-to-br from-[#2a2d33] to-[#151618]" style={{ borderColor: `${cardColor}4D` }} />
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />

                        <div className="absolute top-6 left-6 z-10">
                            <div className="font-black text-[32px] leading-none drop-shadow-md" style={{ color: cardColor }}>
                                {style === '공격' ? '92' : style === '수비' ? '88' : '90'}
                            </div>
                            <div className="text-white/60 text-[14px] font-bold tracking-widest mt-1 uppercase">
                                {position === '전위(네트)' ? 'NET' : position === '후위(베이스)' ? 'BAS' : 'ALL'}
                            </div>
                        </div>

                        <div className="absolute top-4 right-6 z-10">
                            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg" style={{ borderColor: cardColor }}>
                                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white">
                                    <span className="text-[10px] font-bold text-black italic">TEN</span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[200px] h-[200px] z-10">
                            <div className="w-full h-full rounded-full border-4 shadow-2xl overflow-hidden bg-[#333D4B] relative" style={{ borderColor: cardColor, boxShadow: `0 0 30px ${cardColor}66` }}>
                                {photoUrl ? (
                                    <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold bg-gradient-to-b from-[#333D4B] to-[#111315]" style={{ color: cardColor }}>
                                        {getInitials(nickname)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="absolute bottom-6 left-6 right-6 z-10 text-center">
                            <h2 className="text-[28px] font-black text-white uppercase tracking-tight drop-shadow-lg mb-1">{nickname || 'PLAYER'}</h2>
                            <div className="h-[2px] w-12 mx-auto mb-4" style={{ backgroundColor: cardColor }} />
                            <div className="grid grid-cols-3 gap-2 text-center text-white">
                                <div>
                                    <div className="text-[11px] font-bold tracking-wider" style={{ color: cardColor }}>STYLE</div>
                                    <div className="text-[14px] font-bold mt-0.5">{style}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold tracking-wider" style={{ color: cardColor }}>HAND</div>
                                    <div className="text-[14px] font-bold mt-0.5">R</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold tracking-wider" style={{ color: cardColor }}>POS</div>
                                    <div className="text-[14px] font-bold mt-0.5">{position === '무관' ? 'ALL' : position.substring(0, 2)}</div>
                                </div>
                            </div>
                            <p className="text-[12px] text-gray-400 mt-4 line-clamp-2 px-2 font-medium italic opacity-70">
                                {bio || "Elite Tennis Player"}
                            </p>
                        </div>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[24px] overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-[#0A0B0D]" />
                        <div className="absolute inset-[4px] rounded-[20px] border-2 bg-gradient-to-br from-[#1a1c20] to-[#0a0b0d]" style={{ borderColor: cardColor }} />

                        <div className="absolute inset-0 z-10 flex flex-col pt-10 pb-6">
                            <h3 className="text-[14px] font-bold tracking-[0.2em] mb-2 text-center" style={{ color: cardColor }}>PLAYER ABILITY</h3>

                            <div className="flex-1 w-full px-4 overflow-hidden">
                                <PlayerRadarChart skills={{
                                    serve: skillServe,
                                    forehand: skillForehand,
                                    backhand: skillBackhand,
                                    volley: skillVolley,
                                    stamina: skillStamina,
                                    manner: skillManner
                                }} />
                            </div>

                            <div className="px-8 mt-2">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-4">
                                    <div>
                                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Equipment</p>
                                        <p className="text-[12px] font-bold text-white truncate">{racket || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Schedule</p>
                                        <p className="text-[12px] font-bold text-white truncate">{prefDays} / {prefSlots}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pb-4 flex flex-col items-center">
                                <div className="text-[9px] font-black tracking-[0.3em] text-white/10 italic">PRO ANALYTICS</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
                <p className="mt-4 text-[12px] text-[#6B7684] font-medium flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 11 3 3 3-3" /><path d="m22 13-3-3-3 3" /><path d="M5 14v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1" /></svg>
                    마우스로 카드를 뒤집어 능력치를 확인하세요
                </p>
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
                            <label className="block text-[13px] font-bold text-[#4E5968] mb-2">닉네임 (필수)</label>
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

                <div className="pt-4">
                    <Button fullWidth size="lg" onClick={updateProfile} disabled={loading} className="h-16 text-[18px] font-black rounded-[20px] shadow-xl shadow-blue-500/20">
                        {loading ? '저장 중...' : '프로필 완성하기'}
                    </Button>
                </div>
            </Card>

            <style jsx global>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
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
