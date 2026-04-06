import { PillNav } from '@/components/layout/PillNav'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { Problem } from '@/components/sections/Problem'
import { Solution } from '@/components/sections/Solution'
import { WhatWeVerify } from '@/components/sections/WhatWeVerify'
import { WhoItsFor } from '@/components/sections/WhoItsFor'
import { TheReport } from '@/components/sections/TheReport'
import { Security } from '@/components/sections/Security'
import { BiggerPicture } from '@/components/sections/BiggerPicture'
import { NvidiaInception } from '@/components/sections/NvidiaInception'
import { RiskCheck } from '@/components/sections/RiskCheck'
import { SampleReport } from '@/components/sections/SampleReport'
import { Testimonials } from '@/components/sections/Testimonials'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner'
import { MobileStickyBar } from '@/components/ui/MobileStickyBar'
import { ScrollProgress } from '@/components/ui/ScrollProgress'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <PillNav />
      <AnnouncementBanner />
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
