
'use client'

import React from 'react'
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
} from 'recharts'

interface PlayerRadarChartProps {
    skills: {
        serve: number
        forehand: number
        backhand: number
        volley: number
        stamina: number
        manner: number
    }
}

export default function PlayerRadarChart({ skills }: PlayerRadarChartProps) {
    const data = [
        { subject: '서브', A: skills.serve, fullMark: 100 },
        { subject: '포핸드', A: skills.forehand, fullMark: 100 },
        { subject: '백핸드', A: skills.backhand, fullMark: 100 },
        { subject: '발리', A: skills.volley, fullMark: 100 },
        { subject: '체력', A: skills.stamina, fullMark: 100 },
        { subject: '매너', A: skills.manner, fullMark: 100 },
    ]

    return (
        <div className="w-full h-full flex items-center justify-center p-2">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <defs>
                        <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#00D1FF" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#CCFF00" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                    <PolarGrid stroke="#ffffff15" gridType="polygon" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#ffffff99', fontSize: 10, fontWeight: '800' }}
                    />
                    <Radar
                        name="Skills"
                        dataKey="A"
                        stroke="#CCFF00"
                        strokeWidth={2}
                        fill="url(#radarGradient)"
                        fillOpacity={0.7}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    )
}
