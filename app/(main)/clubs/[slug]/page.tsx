import { redirect } from 'next/navigation'
import DashboardClient from '@/app/(main)/DashboardClient'

export default async function ClubDashboardPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    if (params.slug === 'non') {
        redirect('/dashboard')
    }
    return (
        <div className="relative">
            <div className="bg-red-600 text-white font-bold p-2 text-center text-xs z-[9999] relative">
                [DEBUG] Club Page Loaded: {params.slug}
            </div>
            <DashboardClient clubSlug={params.slug} />
        </div>
    )
}
