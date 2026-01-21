'use client'

import React, { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'

// Korea Region Data (Simplified)
const KOREA_REGIONS: { [key: string]: string[] } = {
    '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
    '경기': ['수원시', '성남시', '고양시', '용인시', '부천시', '안산시', '안양시', '남양주시', '화성시', '평택시', '의정부시', '시흥시', '파주시', '광명시', '김포시', '군포시', '광주시', '이천시', '양주시', '오산시', '구리시', '안성시', '포천시', '의왕시', '하남시', '여주시', '양평군', '동두천시', '과천시', '가평군', '연천군'],
    '인천': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
    '부산': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
    '대구': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'],
    '광주': ['동구', '서구', '남구', '북구', '광산구'],
    '대전': ['동구', '중구', '서구', '유성구', '대덕구'],
    '울산': ['중구', '남구', '동구', '북구', '울주군'],
    '세종': ['세종시'],
    '강원': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
    '충북': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
    '충남': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
    '전북': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
    '전남': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
    '경북': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
    '경남': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
    '제주': ['제주시', '서귀포시']
}

function ClubJoinForm() {
    const router = useRouter()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        region1: '', // Do/Si
        region2: '', // Gun/Gu
        description: '',
        memberCount: '', // New field
        file: null as any
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            alert('로그인이 필요한 서비스입니다.')
            router.push('/login?redirect=/club-join')
            return
        }

        if (!formData.name || !formData.region1 || !formData.region2 || !formData.memberCount) {
            alert('모든 필수 정보를 입력해주세요.')
            return
        }

        setLoading(true)
        const supabase = createClient()

        try {
            let logoUrl = null

            // 1. Upload Logo if exists
            if (formData.file) {
                const fileExt = formData.file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('club-logos')
                    .upload(fileName, formData.file)

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('club-logos')
                        .getPublicUrl(fileName)
                    logoUrl = publicUrl
                }
            }

            // 2. Insert Request
            const slug = formData.name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000)
            const fullRegion = `${formData.region1} ${formData.region2}`
            // Append member count to description for now (since DB schema update is complex on the fly)
            const fullDescription = `[현재 인원: ${formData.memberCount}명]\n\n${formData.description}`

            const { error: insertError } = await supabase
                .from('clubs')
                .insert({
                    name: formData.name,
                    slug: slug,
                    description: fullDescription, // Storing member count here temporarily
                    region: fullRegion,
                    logo_url: logoUrl,
                    owner_id: user.id,
                    status: 'PENDING'
                })

            if (insertError) throw insertError

            alert('신청이 완료되었습니다! 검토 후 연락드리겠습니다.')
            router.push('/')

        } catch (error: any) {
            console.error('Error creating club:', error)
            alert('오류가 발생했습니다: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0A0E17] text-white pb-20">
            <header className="px-6 py-6 flex items-center gap-4 border-b border-white/5">
                <button onClick={() => router.back()} className="text-white/60 hover:text-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <h1 className="text-[18px] font-bold">클럽 개설 신청</h1>
            </header>

            <main className="p-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className="text-[24px] font-black italic mb-2">JOIN<br /><span className="text-[#CCFF00]">MATCHUP PRO</span></h2>
                    <p className="text-white/40 text-[13px]">
                        운영 중인 클럽을 등록하세요.<br />
                        체계적인 관리 시스템을 제공해드립니다.
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center">
                        <label className="relative cursor-pointer group">
                            <div className="w-24 h-24 rounded-[32px] bg-[#191F28] border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden transition-colors group-hover:border-[#CCFF00]/50">
                                {formData.file ? (
                                    <img src={URL.createObjectURL(formData.file)} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <svg className="w-8 h-8 text-white/20 mx-auto mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                        <span className="text-[10px] text-white/30 font-bold">LOGO</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[12px] font-bold text-white/60 ml-1">클럽 이름</label>
                            <input
                                type="text"
                                className="w-full h-12 bg-[#191F28] border border-white/10 rounded-xl px-4 text-white focus:border-[#CCFF00] outline-none transition-colors font-bold placeholder:text-white/20"
                                placeholder="예: 무명 테니스 클럽"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Region Selection Level 1 & 2 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[12px] font-bold text-white/60 ml-1">시/도</label>
                                <select
                                    className="w-full h-12 bg-[#191F28] border border-white/10 rounded-xl px-4 text-white focus:border-[#CCFF00] outline-none transition-colors appearance-none font-bold"
                                    value={formData.region1}
                                    onChange={e => setFormData({ ...formData, region1: e.target.value, region2: '' })}
                                >
                                    <option value="" disabled>선택</option>
                                    {Object.keys(KOREA_REGIONS).map(region => (
                                        <option key={region} value={region}>{region}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[12px] font-bold text-white/60 ml-1">시/군/구</label>
                                <select
                                    className="w-full h-12 bg-[#191F28] border border-white/10 rounded-xl px-4 text-white focus:border-[#CCFF00] outline-none transition-colors appearance-none font-bold"
                                    value={formData.region2}
                                    onChange={e => setFormData({ ...formData, region2: e.target.value })}
                                    disabled={!formData.region1}
                                >
                                    <option value="" disabled>선택</option>
                                    {formData.region1 && KOREA_REGIONS[formData.region1].map(subRegion => (
                                        <option key={subRegion} value={subRegion}>{subRegion}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Member Count */}
                        <div className="space-y-1">
                            <label className="text-[12px] font-bold text-white/60 ml-1">현재 인원</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full h-12 bg-[#191F28] border border-white/10 rounded-xl px-4 text-white focus:border-[#CCFF00] outline-none transition-colors font-bold placeholder:text-white/20"
                                    placeholder="예: 30"
                                    value={formData.memberCount}
                                    onChange={e => setFormData({ ...formData, memberCount: e.target.value })}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-[12px] font-bold">명</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[12px] font-bold text-white/60 ml-1">클럽 소개 (선택)</label>
                            <textarea
                                className="w-full h-32 bg-[#191F28] border border-white/10 rounded-xl p-4 text-white focus:border-[#CCFF00] outline-none transition-colors resize-none placeholder:text-white/20 text-[14px]"
                                placeholder="클럽의 특징, 주 활동 시간대 등을 입력해주세요."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        className="bg-[#CCFF00] text-black font-black mt-4 h-14 text-[16px] shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                        isLoading={loading}
                    >
                        {loading ? '제출 중...' : (user ? '클럽 심사 요청하기' : '로그인하고 신청하기')}
                    </Button>
                </form>
            </main>
        </div>
    )
}

export default function ClubJoinPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0A0E17]" />}>
            <ClubJoinForm />
        </Suspense>
    )
}
