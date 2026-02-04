'use client'

import React from 'react'
import LandingPage from './LandingPage'

export default function Page() {
    return (
        <>
            <div className="fixed top-0 left-0 w-full h-1 bg-green-500 z-[10000]"></div>
            <LandingPage />
        </>
    )
}
