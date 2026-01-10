
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Profile State
    const [nickname, setNickname] = useState('')
    const [style, setStyle] = useState('올라운드')
    const [position, setPosition] = useState('무관')
    const [bio, setBio] = useState('')
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)
    const [cardColor, setCardColor] = useState('#D4AF37') // Default Gold

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

            {/* Game Card Preview */}
            <div className="flex justify-center mb-8">
                <div className="relative w-[300px] h-[480px] rounded-[24px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:scale-[1.02]">
                    {/* Background Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c20] via-[#0f1012] to-[#000000]" />

                    {/* Dynamic Accent/Border */}
                    <div
                        className="absolute inset-[4px] rounded-[20px] border-2 bg-gradient-to-br from-[#2a2d33] to-[#151618]"
                        style={{ borderColor: `${cardColor}4D` }} // 30% opacity
                    />
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />

                    {/* Top Stats / Rating */}
                    <div className="absolute top-6 left-6 z-10">
                        <div className="font-black text-[32px] leading-none drop-shadow-md" style={{ color: cardColor }}>
                            {style === '공격' ? '92' : style === '수비' ? '88' : '90'}
                        </div>
                        <div className="text-white/60 text-[14px] font-bold tracking-widest mt-1">
                            {position === '전위(네트)' ? 'NET' : position === '후위(베이스)' ? 'BAS' : 'ALL'}
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-4 right-6 z-10">
                        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center" style={{ borderColor: cardColor }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: cardColor }}>
                                <span className="text-[10px] font-bold text-black">KR</span>
                            </div>
                        </div>
                    </div>

                    {/* Player Image */}
                    <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[200px] h-[200px] z-10">
                        <div
                            className="w-full h-full rounded-full border-4 shadow-lg overflow-hidden bg-[#333D4B] relative"
                            style={{ borderColor: cardColor, boxShadow: `0 0 20px ${cardColor}66` }}
                        >
                            {photoUrl ? (
                                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl font-bold bg-gradient-to-b from-[#333D4B] to-[#111315]" style={{ color: cardColor }}>
                                    {getInitials(nickname)}
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-0 rounded-full ring-2 ring-white/10" />
                    </div>

                    {/* Name & Info */}
                    <div className="absolute bottom-6 left-6 right-6 z-10 text-center">
                        <h2 className="text-[28px] font-black text-white uppercase tracking-tight drop-shadow-lg mb-1">
                            {nickname || 'PLAYER'}
                        </h2>

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

                        {bio && (
                            <p className="text-[12px] text-gray-400 mt-4 line-clamp-2 px-2 font-medium">
                                "{bio}"
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <Card className="space-y-6">
                <div>
                    <label className="block text-[13px] font-bold text-[#333D4B] mb-2">카드 테마 색상</label>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {['#D4AF37', '#E53E3E', '#3182CE', '#38A169', '#805AD5', '#D69E2E', '#718096'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setCardColor(c)}
                                className={`w-10 h-10 rounded-full flex-shrink-0 transition-all ${cardColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-[13px] font-bold text-[#333D4B] mb-2">프로필 사진</label>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#F2F4F6] overflow-hidden flex-shrink-0 border border-gray-200">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                    ?
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[#E5E8EB] file:text-[#333D4B]
                                hover:file:bg-[#D1D6DB]
                            "
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[13px] font-bold text-[#333D4B] mb-2">닉네임 (필수)</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full p-3 bg-[#F9FAFB] rounded-[12px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none transition-all"
                        placeholder="코트 위 별명을 입력하세요"
                    />
                </div>

                <div>
                    <label className="block text-[13px] font-bold text-[#333D4B] mb-2">플레이 스타일</label>
                    <div className="flex gap-2">
                        {['공격', '수비', '올라운드'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStyle(s)}
                                className={`flex-1 py-3 rounded-[12px] text-[14px] font-medium transition-all ${style === s ? 'bg-[#0064FF] text-white' : 'bg-[#F2F4F6] text-[#6B7684]'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[13px] font-bold text-[#333D4B] mb-2">선호 포지션</label>
                    <div className="flex gap-2">
                        {['전위(네트)', '후위(베이스)', '무관'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPosition(p)}
                                className={`flex-1 py-3 rounded-[12px] text-[14px] font-medium transition-all ${position === p ? 'bg-[#333D4B] text-white' : 'bg-[#F2F4F6] text-[#6B7684]'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[13px] font-bold text-[#333D4B] mb-2">한 줄 소개</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full p-3 bg-[#F9FAFB] rounded-[12px] border-none focus:ring-2 focus:ring-[#0064FF] outline-none transition-all resize-none h-24"
                        placeholder="자신을 소개해보세요."
                    />
                </div>

                <Button fullWidth size="lg" onClick={updateProfile} disabled={loading}>
                    {loading ? '저장 중...' : '저장하기'}
                </Button>
            </Card>
        </div>
    )
}
