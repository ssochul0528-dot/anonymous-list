import { redirect } from 'next/navigation'
import DashboardClient from '@/app/(main)/DashboardClient'

export default async function ClubDashboardPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    return (
        <div className="relative">
            <div className="bg-red-600/10 text-red-500 font-bold p-2 text-center text-[10px] z-[9999] relative">
                [DEBUG] Club Page Loaded: {decodeURIComponent(params.slug)}
            </div>
            <DashboardClient clubSlug={params.slug} />
        </div>
    )
}
