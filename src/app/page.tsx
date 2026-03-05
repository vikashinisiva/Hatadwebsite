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
import { FinalCTA } from '@/components/sections/FinalCTA'
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <PillNav />
      <AnnouncementBanner />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <WhatWeVerify />
        <WhoItsFor />
        <TheReport />
        <Security />
        <BiggerPicture />
        <NvidiaInception />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
