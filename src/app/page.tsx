import dynamic from 'next/dynamic'
import { PillNav } from '@/components/layout/PillNav'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { MobileStickyBar } from '@/components/ui/MobileStickyBar'
import { ScrollProgress } from '@/components/ui/ScrollProgress'

// Lazy-load below-the-fold sections — only load when user scrolls
const Problem = dynamic(() => import('@/components/sections/Problem').then(m => ({ default: m.Problem })))
const RiskCheck = dynamic(() => import('@/components/sections/RiskCheck').then(m => ({ default: m.RiskCheck })))
const Solution = dynamic(() => import('@/components/sections/Solution').then(m => ({ default: m.Solution })))
const SampleReport = dynamic(() => import('@/components/sections/SampleReport').then(m => ({ default: m.SampleReport })))
const WhatWeVerify = dynamic(() => import('@/components/sections/WhatWeVerify').then(m => ({ default: m.WhatWeVerify })))
const WhoItsFor = dynamic(() => import('@/components/sections/WhoItsFor').then(m => ({ default: m.WhoItsFor })))
const TheReport = dynamic(() => import('@/components/sections/TheReport').then(m => ({ default: m.TheReport })))
const Security = dynamic(() => import('@/components/sections/Security').then(m => ({ default: m.Security })))
const Testimonials = dynamic(() => import('@/components/sections/Testimonials').then(m => ({ default: m.Testimonials })))
const BiggerPicture = dynamic(() => import('@/components/sections/BiggerPicture').then(m => ({ default: m.BiggerPicture })))
const NvidiaInception = dynamic(() => import('@/components/sections/NvidiaInception').then(m => ({ default: m.NvidiaInception })))
const FinalCTA = dynamic(() => import('@/components/sections/FinalCTA').then(m => ({ default: m.FinalCTA })))

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <PillNav />
      <main>
        <Hero />
        <Problem />
        <RiskCheck />
        <Solution />
        <SampleReport />
        <WhatWeVerify />
        <WhoItsFor />
        <TheReport />
        <Security />
        <Testimonials />
        <BiggerPicture />
        <NvidiaInception />
        <FinalCTA />
      </main>
      <Footer />
      <MobileStickyBar />
      <ScrollProgress />
    </div>
  )
}
