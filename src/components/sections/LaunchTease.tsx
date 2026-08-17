'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
// Bundled locally on purpose. Injecting the CDN <link> (as Hero.tsx does) fails
// here because Termly runs with autoBlock and holds third-party resources until
// consent — the stylesheet never arrives and the map canvas renders unsized.
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  COMPANY,
  DEFAULT_DIAL,
  DIAL_CODES,
  LAUNCH_DATE,
  LAUNCH_DISTRICTS,
  LAUNCH_MAP_CITIES,
  SOCIALS,
  TIMEZONE_DIAL,
} from '@/lib/constants'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { ConvergenceDiagram } from '@/components/sections/ConvergenceDiagram'
import { CoverageCount } from '@/components/sections/CoverageCount'
import { DepartmentDescent } from '@/components/sections/DepartmentDescent'
import type { Coverage } from '@/lib/coverage'
import { classifyContact, type ContactReject } from '@/lib/waitlist-contact'
import { track } from '@/lib/track'
import {
  SOURCE_CLAIM,
  SCAN_STEPS_BASE,
  SOURCE_COUNT,
  scanStepsFor,
} from '@/lib/departments'

type Lang = 'en' | 'ta'

/*
 * The launch day, spelled out, in both languages.
 *
 * Derived from LAUNCH_DATE rather than typed into copy — the countdown and this
 * sentence would otherwise be free to disagree, and a launch page contradicting
 * itself about its own launch date is the one error nobody forgives.
 *
 * The timeZone is pinned, so the server and the client format identically and
 * there is no hydration mismatch.
 */
const launchDay = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(LAUNCH_DATE))

const COPY = {
  en: {
    index: 'Launching',
    /*
     * Schwartz: this is a Stage-1 market (nobody else makes this claim in TN)
     * and a problem-aware, solution-unaware buyer. Both call for a plain,
     * direct statement of the need — not a statistic and not a curiosity gap,
     * which are moves for jaded, later-stage markets.
     *
     * The specificity lives in the sub-line: a number someone can repeat is
     * what actually spreads, and naming departments nobody expects you to touch
     * is the proof.
     */
    head: 'Know what’s wrong with the land before you pay for it.',
    /* "departments and courts", not "departments": of the 30, twenty-nine are
       government departments and one is the judiciary. "Courts" also comes out
       of the enumeration that follows, where it was doing the same job twice. */
    sub: `We read ${SOURCE_CLAIM} government departments and courts — registration, revenue, survey, forest, highways, planning — and hand you one report.`,
    placeholder: 'Email or mobile number',
    /*
     * The reason to join now.
     *
     * Deliberately not an incentive and not a constraint. Two earlier drafts
     * explained what limits us — a capped intake, work done by hand — and both
     * read small however they were phrased: a sentence whose job is "here is
     * what we cannot do" cannot also carry authority.
     *
     * This opens on an observation instead. Anyone who has actually tried to
     * buy land here knows the records lag the deal; saying so first establishes
     * that we are inside the problem, and only then mentions the date. The
     * offer is credibility, which is the only thing a report is ever bought on.
     */
    offerLead: 'Deals move faster than records do.',
    offerBody: (day: string) => `From ${day} you can check a plot the day you stand on it.`,
    /*
     * Shown once LAUNCH_DATE has passed.
     *
     * Same sentence with the date removed rather than a new claim. Launching is
     * a manual env-var flip, so the moment the date passes this page can be
     * live-in-copy while still gated in reality — and anything that announced
     * "we have launched" would be a lie for however long that gap lasts. Saying
     * less is the only thing that is true at every point on that timeline.
     */
    offerBodyLive: 'You can check a plot the day you stand on it.',
    /*
     * The closing ask, after the questions. Different words to the hero on
     * purpose: at the top the reader is deciding whether to keep reading, and
     * the offer answers "why now". Here they are deciding whether to leave, and
     * a line they have already read is not an argument — it is an echo.
     *
     * States the one thing that is true whatever they do, and makes the choice
     * the only variable. No number, no date, and nothing about us: the reader
     * has just spent four sections on our evidence and does not need a fifth.
     *
     * offerClose is shared with the hero deliberately. Repeating one line is a
     * refrain; repeating all three is running out of things to say.
     */
    closeLead: 'You will find out either way.',
    closeBody: 'The only question is whether you find out before you pay, or after.',
    offerClose: 'The list goes first.',
    cta: 'Join',
    /*
     * Two hints, because the promise is genuinely different.
     *
     * "One notice at launch. Nothing else." was true when a signup sent nothing.
     * It stopped being true for addresses the moment the confirmation mail
     * shipped — that would be two mails, on a page whose whole argument is that
     * it tells you what is actually the case.
     *
     * A number still gets exactly one message, because there is no SMS or
     * WhatsApp sender yet and its only receipt is the screen. So the line
     * follows entryMode rather than overclaiming for both.
     */
    hint: 'One notice at launch. Nothing else.',
    hintEmail: 'A confirmation now, then one notice at launch.',
    thanks: "You're in. We'll write once — the day we go live.",
    sending: 'Adding',
    goLive: 'Public launch in',
    cdDays: 'days',
    cdHours: 'hours',
    cdMins: 'min',
    cdSecs: 'sec',
    fix: 'Checking',
    /* Two headers, because the pairing is the argument: a floor that never
       changes, and a set that exists only because of where this parcel sits. */
    baseLead: 'Every parcel',
    /* Names the trigger, not the rule. "Because it's in Chennai" is the whole
       argument for a location-aware check, in four words. */
    localLead: (city: string) => `Because it’s in ${city}`,
    /* Without this the readout reads as the complete list, which undersells it
       by a factor of five. Says outright that it is an extract. */
    sample: (n: number) => `${n} of ${SOURCE_CLAIM} sources shown`,
    invalid: 'Enter a 10-digit mobile number or a valid email.',
    network: 'Network error. Check your connection and try again.',
    rejects: {
      empty: 'Enter a mobile number or an email address.',
      unrecognised: 'That is not a 10-digit mobile number or an email address.',
      phone_prefix: 'Indian mobile numbers start with 6, 7, 8 or 9.',
      phone_fake: 'Enter a number we can actually reach you on.',
      email_shape: 'That email address looks incomplete.',
      email_disposable: 'Use an address you actually check — we only write once.',
    } satisfies Record<ContactReject, string>,
    alreadyJoined: "You're already on the list. Same place, same link.",
    position: 'Your place',
    shareLead: 'Every person who joins on your link moves you up three places.',
    copy: 'Copy',
    copied: 'Copied',
    trustPrivacy: 'We use this only to tell you we have launched. Nothing else, no sharing.',
    follow: 'Follow along',
    ccVillages: 'villages mapped',
    ccSro: 'sub-registrar offices',
    ccDistricts: 'revenue districts',
    ccZones: 'registration zones',
    /*
     * The closing statement of the whole argument.
     *
     * Deliberately says nothing about speed. Turnaround is the one claim that
     * dates badly — it is a promise about operations rather than about the
     * problem, and it stops being impressive the first time ops slips.
     *
     * What is left is the thesis: none of this is secret, it is simply held in
     * places that were never built to be read together. That is the problem the
     * system exists to solve, and it is the one sentence on the page that says
     * what HataD actually is.
     */
    line: `The records are public. Every one of them. They sit in ${SOURCE_COUNT} offices that were never built to talk to each other — one holds the deed, another the tax, another indexes by name and not by land. Nobody has ever read them together. That is the whole of what we do.`,
    /*
     * NVIDIA Inception.
     *
     * Deliberately narrower than the claim on the marketing site, which says
     * the infrastructure "behind autonomous vehicles and drug discovery now
     * powers" our clearance process. Inception is a free startup programme —
     * it is not an investment, not an endorsement, and it does not mean we run
     * that hardware. On a page whose entire pitch is that we check what is
     * actually on record, an overstated credential is the worst possible thing
     * to be caught on.
     *
     * So: what the membership is, and when it started. The badge carries the
     * weight; the sentence just has to be true.
     */
    nvLabel: 'Membership',
    nvTitle: 'HataD is a member of NVIDIA Inception.',
    nvBody: 'NVIDIA’s programme for startups working in AI and data science.',
    nvMeta: 'Member since 2025',
    /* "IIT Madras Shaastra" rather than "IITM Shaastra" — that is how the mark
       itself is set, and the credential is worth nothing if the name on it is
       not the name people can look up. */
    shLabel: 'Featured',
    shTitle: 'Featured in IIT Madras Shaastra.',
    shBody: 'The annual technical festival of IIT Madras.',
    shMeta: 'August 2026',
    vrTag: 'Illustrative example',
    vrParcel: 'Survey No. 114/2B · Salem',
    sourcesIndex: 'Sources',
    sourcesOf: 'of',
    /*
     * The payoff.
     *
     * "…and you get one report" summarised the section instead of landing it —
     * after twenty-eight sources it made the deliverable sound like paperwork,
     * and a summary is the one thing the reader has just done for themselves by
     * scrolling. This turns the count into a stake: the descent proved the list
     * is long, and the only thing that matters about a long list is that it has
     * to be finished. The number is derived, so it can never contradict the
     * counter directly above it.
     */
    sourcesClose: `Miss one, and the other ${SOURCE_COUNT - 1} don’t matter.`,
    sourcesCloseSub: 'We open every one of them before you pay.',
    coverageIndex: 'Coverage',
    coverageTitle: `All ${LAUNCH_DISTRICTS.length} districts of Tamil Nadu from day one.`,
    questionsIndex: 'Questions',
    questionsTitle: 'The questions worth asking.',
    faq: [
      {
        q: 'I already have an Encumbrance Certificate.',
        a: 'An EC lists registered transactions for the period you asked for, and nothing else. It will not show a pending civil suit, a forest Section 4 notification, a highway 3A alignment, or land classified as poromboke. Those live in other departments — and that is where deals fail.',
      },
      {
        q: 'The patta is in the seller’s name.',
        a: 'Patta is a revenue record of who pays the tax on a parcel. It is not, on its own, proof of title. We trace the ownership chain through the registration records and check it against the survey sketch and the revenue classification.',
      },
      {
        q: 'My advocate is already checking the documents.',
        a: 'Keep them. An advocate reads the documents they are handed. We go and find the ones you were not given — what the FMB sketch actually shows, whether the plot sits under an acquisition notice, whether a temple or Waqf claim is registered against it. Take our report to your advocate.',
      },
      {
        q: 'What do you need from me?',
        a: 'A survey number and district, or just your location on the map. Documents help but are not needed to start.',
      },
      {
        q: 'Is this legal advice?',
        a: 'No. We report what the government records say and cite the source for every finding. What you do with it is between you and your advocate.',
      },
      {
        q: 'What will it cost?',
        a: 'Confirmed at launch. Everyone on the waitlist hears the price first, before the site opens.',
      },
    ],
  },
  ta: {
    index: 'விரைவில்',
    head: 'பணம் கொடுப்பதற்கு முன், நிலத்தில் என்ன குறை உள்ளது என்று அறியுங்கள்.',
    sub: `பதிவுத்துறை, வருவாய், அளவை, வனம், நெடுஞ்சாலை, நகர அமைப்பு — ${SOURCE_CLAIM} அரசுத் துறைகள் மற்றும் நீதிமன்றங்களின் ஆவணங்களைப் படித்து, ஒரே அறிக்கையாகத் தருகிறோம்.`,
    placeholder: 'மின்னஞ்சல் அல்லது கைபேசி எண்',
    offerLead: 'பத்திரப் பதிவுகளை விட வேகமாக நகர்வது பேரம்.',
    offerBody: (day: string) =>
      `${day} முதல், நீங்கள் நிலத்தில் நிற்கும் அன்றே அதைச் சரிபார்க்கலாம்.`,
    offerBodyLive: 'நீங்கள் நிலத்தில் நிற்கும் அன்றே அதைச் சரிபார்க்கலாம்.',
    closeLead: 'எப்படியும் ஒரு நாள் தெரிய வரும்.',
    closeBody: 'பணம் கொடுப்பதற்கு முன்பா, கொடுத்த பின்பா — அதுதான் ஒரே கேள்வி.',
    offerClose: 'பட்டியலில் உள்ளவர்களுக்கு முதல் இடம்.',
    cta: 'இணை',
    hint: 'வெளியீட்டின் போது ஒரு அறிவிப்பு மட்டும்.',
    hintEmail: 'இப்போது ஒரு உறுதிப்படுத்தல், பிறகு வெளியீட்டின் போது ஒரு அறிவிப்பு.',
    thanks: 'இணைந்துவிட்டீர்கள். வெளியீட்டு நாளில் மட்டும் தொடர்பு கொள்வோம்.',
    sending: 'சேர்க்கிறோம்',
    goLive: 'பொது வெளியீடு',
    cdDays: 'நாட்கள்',
    cdHours: 'மணி',
    cdMins: 'நிமிடம்',
    cdSecs: 'வினாடி',
    fix: 'சரிபார்ப்பு',
    nvLabel: 'உறுப்பினர்',
    nvTitle: 'HataD, NVIDIA Inception திட்டத்தின் உறுப்பினர்.',
    nvBody:
      'செயற்கை நுண்ணறிவு மற்றும் தரவு அறிவியல் துறையில் இயங்கும் தொடக்க நிறுவனங்களுக்கான NVIDIA-வின் திட்டம்.',
    nvMeta: '2025 முதல் உறுப்பினர்',
    shLabel: 'இடம்பெற்றது',
    shTitle: 'IIT Madras Shaastra-வில் இடம்பெற்றது.',
    shBody: 'IIT Madras-ன் ஆண்டுதோறும் நடைபெறும் தொழில்நுட்பத் திருவிழா.',
    shMeta: 'ஆகஸ்ட் 2026',
    baseLead: 'ஒவ்வொரு நிலமும்',
    localLead: (city: string) => `${city} பகுதி என்பதால்`,
    sample: (n: number) => `${SOURCE_CLAIM} ஆதாரங்களில் ${n} மட்டும்`,
    invalid: 'சரியான கைபேசி எண் அல்லது மின்னஞ்சலை உள்ளிடவும்.',
    network: 'இணைப்பில் சிக்கல். மீண்டும் முயற்சிக்கவும்.',
    rejects: {
      empty: 'கைபேசி எண் அல்லது மின்னஞ்சலை உள்ளிடவும்.',
      unrecognised: 'இது 10 இலக்க கைபேசி எண்ணோ மின்னஞ்சலோ அல்ல.',
      phone_prefix: 'இந்திய கைபேசி எண்கள் 6, 7, 8 அல்லது 9 இல் தொடங்கும்.',
      phone_fake: 'உங்களைத் தொடர்பு கொள்ளக்கூடிய உண்மையான எண்ணை உள்ளிடவும்.',
      email_shape: 'மின்னஞ்சல் முகவரி முழுமையாக இல்லை.',
      email_disposable: 'நீங்கள் உண்மையில் பயன்படுத்தும் முகவரியைத் தரவும் — ஒரே ஒரு முறை மட்டும் எழுதுவோம்.',
    } satisfies Record<ContactReject, string>,
    alreadyJoined: 'நீங்கள் ஏற்கனவே பட்டியலில் உள்ளீர்கள். அதே இடம், அதே இணைப்பு.',
    position: 'உங்கள் இடம்',
    shareLead: 'உங்கள் இணைப்பில் சேரும் ஒவ்வொருவரும் உங்களை மூன்று இடங்கள் முன்னேற்றுவார்.',
    copy: 'நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது',
    trustPrivacy: 'வெளியீட்டைத் தெரிவிக்க மட்டுமே இதைப் பயன்படுத்துகிறோம். வேறு எதற்கும் இல்லை, பகிர்வும் இல்லை.',
    follow: 'எங்களைப் பின்தொடரவும்',
    ccVillages: 'கிராமங்கள்',
    ccSro: 'சார்-பதிவு அலுவலகங்கள்',
    ccDistricts: 'வருவாய் மாவட்டங்கள்',
    ccZones: 'பதிவு மண்டலங்கள்',
    line: `ஆவணங்கள் பொதுவானவை. ஒவ்வொன்றுமே. ஆனால் ஒன்றோடு ஒன்று பேசாத ${SOURCE_COUNT} அலுவலகங்களில் அவை கிடக்கின்றன — ஒன்றில் பத்திரம், இன்னொன்றில் வரி, மற்றொன்று நிலத்தை அல்ல பெயரை வைத்துத் தேடுகிறது. இவற்றை ஒன்றாக யாரும் படித்ததில்லை. அதுதான் நாங்கள் செய்வது.`,
    vrTag: 'எடுத்துக்காட்டு மட்டும்',
    vrParcel: 'புல எண் 114/2B · சேலம்',
    sourcesIndex: 'ஆதாரங்கள்',
    sourcesOf: '/',
    sourcesClose: `ஒன்றைத் தவறவிட்டால், மீதி ${SOURCE_COUNT - 1}-ம் வீண்.`,
    sourcesCloseSub: 'பணம் கொடுப்பதற்கு முன், ஒவ்வொன்றையும் நாங்கள் பார்க்கிறோம்.',
    coverageIndex: 'பரப்பளவு',
    coverageTitle: `தமிழ்நாட்டின் அனைத்து ${LAUNCH_DISTRICTS.length} மாவட்டங்களும், முதல் நாளிலிருந்தே.`,
    questionsIndex: 'கேள்விகள்',
    questionsTitle: 'கேட்க வேண்டிய கேள்விகள்.',
    faq: [
      {
        q: 'என்னிடம் ஏற்கனவே EC உள்ளது.',
        a: 'EC என்பது நீங்கள் கேட்ட காலத்தில் பதிவான பரிவர்த்தனைகளை மட்டுமே காட்டும். நிலுவையில் உள்ள வழக்கு, வனத்துறை பிரிவு 4 அறிவிப்பு, நெடுஞ்சாலை 3A வரிசை, அல்லது புறம்போக்கு வகைப்பாடு — இவை வேறு துறைகளில் உள்ளன. பரிவர்த்தனைகள் தோல்வியடைவது அங்குதான்.',
      },
      {
        q: 'பட்டா விற்பவர் பெயரில் உள்ளது.',
        a: 'பட்டா என்பது வரி செலுத்துபவரைக் குறிக்கும் வருவாய் ஆவணம். அது மட்டுமே உரிமைக்கான சான்று அல்ல. பதிவுத்துறை ஆவணங்கள் வழியாக உரிமைத் தொடரைக் கண்டறிந்து, அளவைப் படம் மற்றும் வருவாய் வகைப்பாட்டுடன் ஒப்பிடுகிறோம்.',
      },
      {
        q: 'என் வழக்கறிஞர் ஆவணங்களைப் பார்க்கிறார்.',
        a: 'அவரைத் தொடரவும். வழக்கறிஞர் அவரிடம் கொடுக்கப்பட்ட ஆவணங்களைப் படிப்பார். நாங்கள் உங்களுக்குக் கொடுக்கப்படாத ஆவணங்களைத் தேடுகிறோம் — FMB படம் என்ன காட்டுகிறது, நிலம் கையகப்படுத்தல் அறிவிப்பில் உள்ளதா, கோயில் அல்லது வக்பு உரிமைகோரல் பதிவாகியுள்ளதா. எங்கள் அறிக்கையை உங்கள் வழக்கறிஞரிடம் கொடுங்கள்.',
      },
      {
        q: 'எனக்கு என்ன தேவை?',
        a: 'சர்வே எண் மற்றும் மாவட்டம், அல்லது வரைபடத்தில் உங்கள் இடம். ஆவணங்கள் உதவும், ஆனால் தொடங்க அவசியமில்லை.',
      },
      {
        q: 'இது சட்ட ஆலோசனையா?',
        a: 'இல்லை. அரசு ஆவணங்கள் என்ன சொல்கின்றன என்பதைத் தெரிவித்து, ஒவ்வொரு கண்டுபிடிப்புக்கும் ஆதாரத்தைக் குறிப்பிடுகிறோம். அதை எப்படிப் பயன்படுத்துவது என்பது உங்களுக்கும் உங்கள் வழக்கறிஞருக்கும் இடையேயானது.',
      },
      {
        q: 'கட்டணம் என்ன?',
        a: 'வெளியீட்டின் போது உறுதி செய்யப்படும். காத்திருப்பு பட்டியலில் உள்ளவர்கள் முதலில் அறிவார்கள்.',
      },
    ],
  },
} satisfies Record<Lang, Record<string, unknown>>

/*
 * Marks are inlined rather than imported from lucide, which has deprecated all
 * its brand icons — `Instagram` and `Facebook` still resolve today but will be
 * removed. Same geometry and stroke weight as the rest of the page's iconography.
 */
type MarkProps = { size?: number }

const markSvg = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

function InstagramMark({ size = 19 }: MarkProps) {
  return (
    <svg {...markSvg(size)}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  )
}

function FacebookMark({ size = 19 }: MarkProps) {
  return (
    <svg {...markSvg(size)}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

const SOCIAL_ICONS: Record<string, (props: MarkProps) => React.JSX.Element> = {
  Instagram: InstagramMark,
  Facebook: FacebookMark,
}

/*
 * Map cadence — a survey, in three moves per city:
 *
 *   travel   arc across the state, zooming out and back down (flyTo's curve)
 *   inspect  hold over the plot and rotate slowly across the 3D buildings
 *   travel   on to the next city
 *
 * The inspect leg is the point: it is the only moment the map shows an actual
 * built parcel, which is what HataD is looking at.
 *
 * Unhurried on purpose. A fast flight outruns tile loading and you watch the
 * map assemble itself in squares. Only the first lap costs anything — the same
 * five cities repeat, so once they are cached the loop is seamless.
 */
const ACQUIRE_MS = 6000 // opening descent onto the first city
const TRAVEL_MS = 7500 // city to city — slow enough for tiles to keep up
const INSPECT_MS = 7000 // slow rotation over the buildings
const INSPECT_ARC_DEG = 38 // how far the camera swings while inspecting
const CITY_ZOOM = 16.1 // buildings still read; every step down is cheaper to load
/*
 * Half-width of the plot in degrees. At z16 the ground scale is roughly
 * 2.3 m/pixel, so this is the number that decides how big the plot looks:
 *   0.0009  → ~200m → covered several city blocks
 *   0.00022 → ~50m  → about 20px, effectively invisible
 *   0.0006  → ~130m → ~55px, reads as a large plot without swallowing the block
 */
const PARCEL_SIZE = 0.0006
/** How long the boundary takes to trace itself around the plot. */
const PARCEL_TRACE_MS = 1100

/**
 * A quadrilateral around a point, slightly irregular so it reads as a surveyed
 * plot rather than a graphic. `t` scales it from the centre (0) to full (1),
 * which is what gives the boundary its draw-in.
 */
function parcelCorners(lon: number, lat: number, seed: number): [number, number][] {
  const s = PARCEL_SIZE
  // Deterministic per city — the same plot every lap, never a random shape.
  const j = (n: number) => 1 + 0.28 * Math.sin(seed * 12.9898 + n * 4.1414)
  return [
    [lon - s * j(1), lat - s * j(2)],
    [lon + s * j(3), lat - s * j(4)],
    [lon + s * j(5), lat + s * j(6)],
    [lon - s * j(7), lat + s * j(8)],
  ]
}

/**
 * The boundary drawn to `p` (0–1) of the way round.
 *
 * A real trace rather than an animated dash: dashes restart at every vertex, so
 * on a four-sided plot they render as disconnected fragments instead of one
 * travelling line. Generating the partial path gives an actual pen stroke.
 */
function tracedBoundary(corners: [number, number][], p: number): [number, number][] {
  const ring = [...corners, corners[0]]
  // Clamped because a negative p yields whole = -1, and `ring[-1]` is undefined
  // — which threw and killed the animation loop on its very first frame.
  const travelled = Math.max(0, Math.min(1, p)) * (ring.length - 1)
  const whole = Math.floor(travelled)
  const path = ring.slice(0, Math.min(whole + 1, ring.length))

  const frac = travelled - whole
  if (frac > 0 && whole + 1 < ring.length) {
    const [ax, ay] = ring[whole]
    const [bx, by] = ring[whole + 1]
    path.push([ax + (bx - ax) * frac, ay + (by - ay) * frac])
  }
  return path
}
/* Past ~55° in a panel this tall the horizon enters frame and most of the view
   becomes sky. Zoom, not pitch, is what makes the buildings large. */
const CITY_PITCH = 54

type MapboxMap = import('mapbox-gl').Map

const EMPTY = { type: 'FeatureCollection' as const, features: [] }

/**
 * Creates the plot's sources and layers if they are not already there.
 *
 * Idempotent and called at the point of use rather than from `style.load`, so
 * there is no ordering to get wrong. The previous version built them all in one
 * block during style load; a throw on any single addLayer aborted the rest of
 * that handler, leaving the trace source missing and the animation silently
 * drawing nothing. Failures are logged now instead of vanishing.
 */
function ensureParcelLayers(map: MapboxMap) {
  try {
    if (!map.getSource('parcel')) {
      map.addSource('parcel', { type: 'geojson', data: EMPTY })
    }
    if (!map.getSource('parcel-trace')) {
      map.addSource('parcel-trace', { type: 'geojson', data: EMPTY })
    }
    if (!map.getLayer('parcel-fill')) {
      map.addLayer({
        id: 'parcel-fill',
        type: 'fill',
        source: 'parcel',
        paint: {
          'fill-color': '#1B4FD8',
          'fill-opacity': 0,
          'fill-opacity-transition': { duration: 400 },
        },
      })
    }
    if (!map.getLayer('parcel-line')) {
      map.addLayer({
        id: 'parcel-line',
        type: 'line',
        source: 'parcel-trace',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#1B4FD8', 'line-width': 2.4 },
      })
    }
    return true
  } catch (err) {
    console.warn('[launch-tease] could not create parcel layers:', err)
    return false
  }
}

function clearParcel(map: MapboxMap) {
  for (const id of ['parcel', 'parcel-trace']) {
    const s = map.getSource(id)
    if (s && s.type === 'geojson') s.setData(EMPTY)
  }
  if (map.getLayer('parcel-fill')) map.setPaintProperty('parcel-fill', 'fill-opacity', 0)
}

/**
 * Traces the plot boundary on arrival, then lets the fill settle in behind it.
 *
 * Per-frame geometry rather than a paint transition: Mapbox can fade a line but
 * cannot draw one, and the drawing is the whole point — it reads as the map
 * marking out a specific piece of land rather than a shape being switched on.
 */
function animateParcel(map: MapboxMap, index: number, alive: () => boolean): () => void {
  ensureParcelLayers(map)

  const trace = map.getSource('parcel-trace')
  const poly = map.getSource('parcel')
  if (!trace || trace.type !== 'geojson' || !poly || poly.type !== 'geojson') {
    console.warn('[launch-tease] parcel sources missing — nothing will be drawn')
    return () => {}
  }

  const [lon, lat] = LAUNCH_MAP_CITIES[index].c
  const corners = parcelCorners(lon, lat, index + 1)

  let raf = 0
  let stopped = false
  let filled = false
  const started = performance.now()

  const frame = (now: number) => {
    if (stopped || !alive() || !map.getSource('parcel-trace')) return

    /*
     * Clamped at both ends. rAF hands you the timestamp of the *start* of the
     * current frame, which can predate the performance.now() captured inside
     * that same frame — so `now - started` is negative on the first callback.
     */
    const t = Math.max(0, Math.min(1, (now - started) / PARCEL_TRACE_MS))
    // easeInOutCubic — starts gently, runs, settles. A pen, not a wipe.
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    trace.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: tracedBoundary(corners, eased) },
        },
      ],
    })

    // Once the outline closes, drop the fill in behind it.
    if (t >= 1 && !filled) {
      filled = true
      poly.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [[...corners, corners[0]]] },
          },
        ],
      })
      if (map.getLayer('parcel-fill')) map.setPaintProperty('parcel-fill', 'fill-opacity', 0.12)
      return // trace is complete; stop burning frames
    }

    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return () => {
    stopped = true
    cancelAnimationFrame(raf)
  }
}

const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0')

function clockParts(msRemaining: number) {
  const s = Math.floor(Math.max(0, msRemaining) / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  }
}

export function LaunchTease({
  coverage,
  initialLang = 'en',
}: {
  coverage: Coverage
  /*
   * Which language this URL is. `/` is English, `/ta` is Tamil.
   *
   * It is a prop rather than client state alone because the whole point of the
   * second URL is that the Tamil copy exists in the server-rendered HTML: with
   * one URL and a toggle, a crawler only ever saw English, and the page could
   * not rank for a Tamil query about Tamil Nadu land.
   */
  initialLang?: Lang
}) {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [entry, setEntry] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [cityIndex, setCityIndex] = useState(0)
  const [moving, setMoving] = useState(true)
  /* How many departments the readout has worked through at the current parcel. */
  const [scanStep, setScanStep] = useState(0)
  /* Increments on every arrival. A plain counter rather than cityIndex, because
     re-arriving at index 0 after a full lap would not change cityIndex and the
     readout would never restart. */
  const [arrival, setArrival] = useState(0)

  // Referral state. `code`/`position` stay null when the waitlist table is not
  // provisioned — the API omits them and the plain confirmation shows instead.
  const [code, setCode] = useState<string | null>(null)
  const [position, setPosition] = useState<number | null>(null)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [copied, setCopied] = useState(false)
  const referrerRef = useRef<string | null>(null)
  const trapRef = useRef<HTMLInputElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  /*
   * Analytics latches. Both events are "the first time this happened", not
   * "every time" — a view that fired twice under StrictMode, or a started that
   * fired per keystroke, would make the funnel unreadable.
   */
  const viewedRef = useRef(false)
  const startedRef = useRef(false)
  const [dial, setDial] = useState(DEFAULT_DIAL)

  // The countdown must not render on the server — the value differs by the time
  // the client hydrates, which React reports as a mismatch.
  const [now, setNow] = useState<number | null>(null)

  const scanOverlayRef = useRef<HTMLDivElement>(null)
  const parcelCentreRef = useRef<[number, number] | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('mapbox-gl').Map | null>(null)

  const t = COPY[lang]

  // ── Countdown ──
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  /*
   * Referral attribution. Read straight off location rather than via
   * useSearchParams, which would force this whole page under a Suspense
   * boundary for one optional query param.
   */
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('r')
    if (ref && /^[A-Z2-9]{4,12}$/.test(ref)) referrerRef.current = ref
  }, [])

  /*
   * Guess the dial code from the browser's timezone. Cheaper and more reliable
   * than a geo-IP call, and wrong only for people travelling — who can change it.
   * Runs after mount so the server and client agree on the first render.
   */
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const guess = TIMEZONE_DIAL[tz] ?? (tz.startsWith('America/') ? '+1' : undefined)
      if (guess) setDial(guess)
    } catch {
      // Intl unavailable — the +91 default is right for almost everyone here.
    }
  }, [])

  /*
   * What this particular parcel gets read against — the four every parcel in
   * the state gets, plus whatever this location adds. Derived from the city the
   * camera has landed on, so the readout changes as the map moves.
   */
  const scanSteps = scanStepsFor(LAUNCH_MAP_CITIES[cityIndex].name)

  /*
   * Restart the readout each time the map arrives somewhere new.
   *
   * Keyed on the arrival counter: a scan belongs to a parcel, so it should start
   * when the camera lands on one — not on mount and not on a camera state.
   */
  useEffect(() => {
    // arrival === 0 is mount, before the camera has landed anywhere. Scanning
    // then would show the readout working through a parcel that is not yet
    // under it, and it would be finished before the map even arrives.
    if (arrival === 0) return

    /* Read from the render that arrival changed in — setCityIndex and
       setArrival are called together, so this is already the new city's list.
       Deliberately not a dependency: the array is rebuilt every render and
       would restart the scan mid-parcel. */
    const total = scanSteps.length

    setScanStep(0)
    // Pace the whole list across the hold, however long the list is — a city
    // with more local checks reads faster rather than running past departure.
    const every = Math.floor(INSPECT_MS / (total + 1))
    const id = setInterval(() => setScanStep((s) => Math.min(s + 1, total)), every)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrival])

  /*
   * ── Funnel ──
   *
   * Four events, all through track(), which is fire-and-forget into
   * analytics_events and whose route always answers 200 — nothing here can
   * break a signup.
   *
   * Vercel Analytics and GA4 already give pageviews. What they cannot give is
   * the shape of this page's funnel: how many of the people who arrive start
   * typing, how many finish, and which of the two forms did it. Without that,
   * launch week is guesswork about which channel to push.
   *
   * NOTHING IDENTIFYING IS SENT. The page promises "we use this only to tell
   * you we have launched — nothing else, no sharing", so the contact itself
   * never leaves for analytics; only whether it was a phone or an email.
   */
  useEffect(() => {
    if (viewedRef.current) return
    viewedRef.current = true
    track('launch_view', 'launch-tease', {
      lang: initialLang,
      /* Whether they arrived on someone's referral link — the only measure of
         whether the referral loop is doing anything at all. */
      referred: new URLSearchParams(window.location.search).has('r'),
    })
  }, [initialLang])

  /* First real keystroke, once. Focus would fire on a stray tab press and
     inflate the top of the funnel. */
  function noteStarted(slot: 'hero' | 'close') {
    if (startedRef.current) return
    startedRef.current = true
    track('launch_signup_started', 'launch-tease', { slot, lang })
  }

  /*
   * Swap language in place and correct the address bar to match.
   *
   * replaceState rather than pushState, deliberately: pushState would add a
   * history entry that the back button could return to, and nothing here
   * listens for popstate — so back would change the URL while the page kept
   * showing the other language. Replacing keeps URL and content in lockstep at
   * the cost of nothing anyone will miss.
   *
   * Modified clicks are left alone so cmd/ctrl-click still opens the other
   * language in a new tab, which is the whole reason these are anchors.
   */
  function switchLang(e: React.MouseEvent<HTMLAnchorElement>, next: Lang) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    if (next === lang) return
    setLang(next)
    window.history.replaceState(null, '', next === 'ta' ? '/ta' : '/')
  }

  /*
   * Keep the document language honest.
   *
   * The <html lang> is written as "en" by the root layout, which is right for
   * the server render but stopped being right the moment this toggle switched
   * the page to Tamil: a screen reader then reads Tamil text with English
   * pronunciation rules, which is close to unusable.
   *
   * Set here rather than in the layout because the layout is a server component
   * and the locale lives in this client component's state.
   */
  useEffect(() => {
    document.documentElement.lang = lang === 'ta' ? 'ta' : 'en'
  }, [lang])

  /*
   * Marks the hero on/off screen, so the CSS above can park the field's idle
   * drift while it cannot be seen.
   *
   * Written straight to the attribute rather than through state: this fires on
   * a scroll boundary and re-rendering the whole tree — map panel included —
   * to flip one string would cost far more than the animation it saves.
   */
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const io = new IntersectionObserver(
      ([entry]) => {
        hero.dataset.onscreen = entry.isIntersecting ? 'true' : 'false'
      },
      { threshold: 0 },
    )
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  // ── Mapbox GL ──
  useEffect(() => {
    if (!mapContainerRef.current) return
    let cancelled = false
    /* Handle for the deferred boot below, so an unmount before it fires does not
       start downloading 1.7 MB for a page nobody is on any more. */
    let bootHandle: number | undefined
    let bootWasIdleCallback = false
    let legTimer: ReturnType<typeof setTimeout> | undefined
    /* Set once the cycle is wired up; tears down the observer and the
       visibilitychange listener that drive it. */
    let releaseVisibility: (() => void) | undefined
    /* Detaches the matchMedia listener that tracks which card layout is live. */
    let releaseMediaQuery: (() => void) | undefined

    /*
     * Everything below used to start the moment this effect ran — which is
     * during hydration, so a 1.7 MB library and its first tiles competed for
     * bandwidth with the fonts and the hero paint. The map is the hero and is
     * staying, but it does not have to be first: the headline is the element
     * that decides LCP, and it needs the network more than the basemap does for
     * the first second.
     *
     * requestIdleCallback with a timeout, so this is a deferral and never a
     * dependency on the browser going idle — if it does not, 1500ms forces it.
     * Safari has no rIC, hence the setTimeout arm.
     *
     * The panel is not blank in the meantime: .lt-map carries a painted
     * backdrop, so the wait reads as the map resolving rather than as a hole.
     */
    const boot = () => {
      if (cancelled || !mapContainerRef.current) return
      loadMap()
    }

    const ric = (window as unknown as { requestIdleCallback?: typeof requestIdleCallback })
      .requestIdleCallback
    if (typeof ric === 'function') {
      bootWasIdleCallback = true
      bootHandle = ric(boot, { timeout: 1500 }) as unknown as number
    } else {
      bootHandle = window.setTimeout(boot, 250)
    }

    function loadMap() {
    import('mapbox-gl').then((mapboxgl) => {
      if (cancelled || !mapContainerRef.current) return

      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

      const [lon, lat] = LAUNCH_MAP_CITIES[0].c
      const map = new mapboxgl.default.Map({
        container: mapContainerRef.current,
        // Standard is the v3 style: real 3D buildings and lighting. light-v11
        // is flat and near-white, which is why the panel read as blank paper.
        style: 'mapbox://styles/mapbox/standard',
        center: [lon, lat],
        zoom: 3.4,
        pitch: 0,
        interactive: false,
        attributionControl: false,
        antialias: true, // 3D building edges alias badly without this
        // Crossfade tiles in rather than popping them. At 0 (which is what a
        // flat basemap wants) you see the map arrive square by square.
        fadeDuration: 380,
        /* The loop revisits the same five cities forever, so a cache big enough
           to hold them all makes every lap after the first tile-free. */
        minTileCacheSize: 200,
        maxTileCacheSize: 500,
        refreshExpiredTiles: false,
      })
      mapRef.current = map

      map.on('style.load', () => {
        if (cancelled) return

        /*
         * Standard exposes its basemap through config properties rather than
         * layers — the old `removeLayer` sweep for symbols throws here, since
         * they live inside a style import. This keeps the map unlabelled while
         * leaving the 3D objects on.
         */
        for (const [prop, value] of [
          ['showPlaceLabels', false],
          ['showPointOfInterestLabels', false],
          ['showRoadLabels', false],
          ['showTransitLabels', false],
          // 'dawn'/'dusk' rake the extrusions more dramatically but tint the
          // whole panel orange, which fights the cool palette of the page.
          ['lightPreset', 'day'],
        ] as const) {
          map.setConfigProperty('basemap', prop, value)
        }

        // Terrain only reads during the arc, when the camera is high enough to
        // see the Ghats. Kept subtle — this is a backdrop, not a flight sim.
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            /*
             * 9, not 14.
             *
             * DEM was the single most expensive thing on this page — 619 KB
             * across 15 requests, more than mapbox-gl itself — because at
             * maxzoom 14 it kept fetching fresh elevation tiles all the way
             * down to street level on every leg.
             *
             * None of that detail is visible. Terrain only reads during the
             * climb-out, when the camera is high enough to see the Ghats; by
             * the time it is over a city the buildings carry the relief and the
             * ground under them is flat anyway. Capping at 9 makes Mapbox
             * overzoom a handful of coarse tiles instead, which is both fewer
             * requests and cache hits on every lap after the first.
             */
            maxzoom: 9,
          })
          map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.15 })
        }
      })

      // Dev-only handle. The camera cadence is the one part of this page that
      // cannot be inspected from the DOM, and diagnosing it by screenshot cost
      // several wrong theories.
      if (process.env.NODE_ENV !== 'production') {
        ;(window as unknown as { __ltMap?: unknown }).__ltMap = map
      }

      map.on('load', () => {
        if (cancelled) return

        /*
         * Pushes the plot into the lower part of the frame on short panels.
         *
         * Mapbox places the camera centre inside the box left after padding, so
         * padding at the top moves the plot down the screen. That is the whole
         * trick: the card hangs ABOVE the plot on a leader, and on a phone the
         * plot was sitting at the panel's midpoint with only ~194px above it —
         * against the 186px card plus a leader. Rather than exile the card to a
         * corner, give it somewhere to hang by moving the plot.
         *
         * 448 is the room the anchored layout needs: card (186) + minimum
         * leader (26) + top margin (12), doubled, because padding shifts the
         * centre by half of what is added. Below that height we add the
         * difference; above it — every desktop panel — this returns 0 and
         * nothing changes.
         */
        const cameraPadding = () => {
          const h = map.getCanvas().clientHeight
          return { top: Math.max(0, 448 - h), bottom: 0, left: 0, right: 0 }
        }

        const legCamera = (index: number) => {
          const [toLon, toLat] = LAUNCH_MAP_CITIES[index].c
          return {
            padding: cameraPadding(),
            center: [toLon, toLat] as [number, number],
            zoom: CITY_ZOOM,
            pitch: CITY_PITCH,
            bearing: (index * 47) % 360, // arrive on a different face each time
            /* 1.42 is van Wijk's measured optimum for zoom-and-pan; pulled below
               it deliberately. A shallower climb crosses fewer zoom levels, and
               each level is a whole extra set of tiles to fetch on the first lap. */
            curve: 1.3,
          }
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          map.jumpTo(legCamera(0))
          setCityIndex(0)
          setArrival((a) => a + 1)
          setMoving(false)
          return
        }

        /*
         * Driven entirely by timers.
         *
         * This used to advance on `moveend`, which cost three separate bugs:
         * it fires for animations that were cancelled rather than completed, it
         * fires on resize, and `flyTo({preloadOnly})` fires it without moving —
         * so "the camera stopped" never reliably meant "we arrived". The loop
         * deadlocked whenever an event went missing.
         *
         * A schedule cannot deadlock. The trade is that arrival is assumed from
         * the duration we asked for rather than observed, which drifts by a few
         * milliseconds nobody can perceive.
         */
        let index = 0
        let stopParcel: (() => void) | undefined

        /*
         * Keeps the department labels pinned to the plot. Written straight to
         * the element's transform rather than through React state — this fires
         * on every frame of the rotation, and re-rendering the tree that often
         * would be wasteful for what is a single translate.
         */
        /* Last values written to the overlay, so identical writes can be skipped
           on the frames where nothing moved. */
        let lastX = NaN
        let lastY = NaN
        let lastVis = ''
        let lastLead = NaN

        /*
         * Which of the two layouts is live.
         *
         * Must agree exactly with the breakpoint in globals.css that pins the
         * card and shows the tether — if these two ever disagree, the card is
         * pinned while the code is still driving the desktop leader, or vice
         * versa. Read once and kept current by a listener rather than queried
         * per frame.
         */
        const scanEl = scanOverlayRef.current

        /*
         * Anchored or pinned, decided by whether the panel can actually hold an
         * anchored card.
         *
         * With cameraPadding() above, the plot lands at least 224px down the
         * panel, which leaves room for the card and a leader on anything taller
         * than ~250px. Only a genuinely tiny panel falls back to the pinned
         * card and its tether.
         *
         * The attribute is what the stylesheet reads, so the two can never
         * disagree about which layout is live.
         */
        const MIN_ANCHORED_PANEL = 250
        let pinned = false
        const syncPinned = () => {
          const next = map.getCanvas().clientHeight < MIN_ANCHORED_PANEL
          if (next === pinned && scanEl?.dataset.pin) return
          pinned = next
          if (scanEl) scanEl.dataset.pin = String(pinned)
        }
        syncPinned()
        window.addEventListener('resize', syncPinned, { passive: true })
        releaseMediaQuery = () => window.removeEventListener('resize', syncPinned)

        /*
         * Draws the line from the pinned card to the plot.
         *
         * Everything is expressed in .lt-scan's own coordinate space: the card
         * sits at its origin (position:static on phones), and the projected
         * parcel point arrives in canvas coordinates, so it is rebased through
         * the two bounding rects.
         *
         * The line starts at the point on the card's box nearest the target —
         * clamping the target into the box gives exactly that — so it leaves
         * whichever edge or corner faces the plot instead of always the same
         * one.
         */
        const drawTether = (el: HTMLElement, p: { x: number; y: number }, onScreen: boolean) => {
          const tether = el.querySelector<HTMLElement>('.lt-scan-tether')
          const tip = el.querySelector<HTMLElement>('.lt-scan-tip')
          const card = el.querySelector<HTMLElement>('.lt-scan-inner')
          if (!tether || !tip || !card) return

          const hide = () => {
            if (tether.style.opacity !== '0') tether.style.opacity = '0'
            if (tip.style.opacity !== '0') tip.style.opacity = '0'
          }
          if (!onScreen) return hide()

          const scanRect = el.getBoundingClientRect()
          const canvasRect = map.getCanvas().getBoundingClientRect()
          const tx = canvasRect.left + p.x - scanRect.left
          const ty = canvasRect.top + p.y - scanRect.top

          /*
           * Stricter than the shared onScreen guard, which allows a whole
           * panel-width of slack because the desktop card rides the plot and
           * has to survive being carried past the edge.
           *
           * A tether has no such excuse: the plot must be inside the panel for
           * a line to it to mean anything. Without this the leg between cities
           * computed lengths like 579px across a 384px panel — a line running
           * off the edge to a place the reader cannot see.
           */
          const margin = 8
          const inPanel =
            p.x > margin &&
            p.x < canvasRect.width - margin &&
            p.y > margin &&
            p.y < canvasRect.height - margin
          if (!inPanel) return hide()

          const cw = card.offsetWidth
          const ch = card.offsetHeight

          /* Nothing to join when the plot has drifted under the card — a line
             with both ends inside the same box is just a smudge. */
          if (tx > -12 && tx < cw + 12 && ty > -12 && ty < ch + 12) return hide()

          const ax = Math.max(0, Math.min(cw, tx))
          const ay = Math.max(0, Math.min(ch, ty))
          const dx = tx - ax
          const dy = ty - ay
          const len = Math.round(Math.hypot(dx, dy))
          const deg = (Math.atan2(dy, dx) * 180) / Math.PI

          tether.style.width = `${len}px`
          tether.style.transform = `translate(${Math.round(ax)}px, ${Math.round(ay)}px) rotate(${deg.toFixed(2)}deg)`
          tip.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px)`
          if (tether.style.opacity !== '0.55') tether.style.opacity = '0.55'
          if (tip.style.opacity !== '1') tip.style.opacity = '1'
        }

        const positionOverlay = () => {
          const el = scanOverlayRef.current
          const centre = parcelCentreRef.current
          if (!el || !centre) return
          const p = map.project(centre)

          /*
           * Once the plot passes behind the camera during the climb-out,
           * project() stops returning a usable point — it saturates to the
           * float32 maximum (3.4e38). The panel clips that harmlessly, but a
           * point folded back inside the frame would not be, and the card no
           * longer fades out to hide it. So hide on anything not plausibly
           * on-screen, using visibility rather than opacity: instant, with no
           * transition to be seen.
           */
          const canvas = map.getCanvas()
          const slack = Math.max(canvas.clientWidth, canvas.clientHeight)
          const onScreen =
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            p.x > -slack &&
            p.x < canvas.clientWidth + slack &&
            p.y > -slack &&
            p.y < canvas.clientHeight + slack
          /*
           * Every write below is guarded against writing the same value twice.
           *
           * This is bound to `render` as well as `move`, so it runs on every
           * frame the map draws — including the many where the camera has not
           * actually moved. Setting an identical inline style still dirties the
           * element and costs style recalc, and there are three of them here.
           * Coordinates are rounded first, both so the comparison can succeed
           * and because sub-pixel churn buys nothing at this size.
           */
          /*
           * Phones take a different path entirely.
           *
           * The card is pinned by CSS and must never blink out — it is always
           * in a valid place, unlike the desktop card which rides the plot and
           * has to hide when the plot goes behind the camera. Only the tether
           * depends on where the plot currently is.
           */
          if (pinned) {
            if (lastVis !== 'visible') {
              el.style.visibility = 'visible'
              lastVis = 'visible'
            }
            drawTether(el, p, onScreen)
            return
          }

          const vis = onScreen ? 'visible' : 'hidden'
          if (vis !== lastVis) {
            el.style.visibility = vis
            lastVis = vis
          }
          if (!onScreen) return

          const x = Math.round(p.x)
          const y = Math.round(p.y)
          if (x !== lastX || y !== lastY) {
            el.style.transform = `translate3d(${x}px, ${y}px, 0)`
            lastX = x
            lastY = y
          }

          /*
           * Shorten the leader when the plot sits high in the panel.
           *
           * The card grew past 260px once it carried both headers and the
           * footnote, and at the default lead that put its top edge off the top
           * of the map. Clamping the card's position instead would detach it
           * from the plot, which is the one thing the leader exists to prevent —
           * so the line gives way, not the anchor.
           */
          const card = el.querySelector<HTMLElement>('.lt-scan-inner')
          if (!card) return
          const room = p.y - card.offsetHeight - 12
          const lead = Math.round(Math.max(26, Math.min(104, room)))
          if (lead !== lastLead) {
            el.style.setProperty('--lead', `${lead}px`)
            lastLead = lead
          }
        }
        map.on('move', positionOverlay)
        map.on('render', positionOverlay)

        /*
         * The cycle only runs while the panel is on screen and the tab is
         * foregrounded.
         *
         * It used to be an unconditional setTimeout recursion, which meant the
         * camera kept flying, kept pulling tiles for all five cities and kept
         * firing positionOverlay on every frame long after the reader had
         * scrolled down to the questions. The map is 46svh of a page that is
         * many screens long, so for most of a visit it was animating something
         * nobody could see.
         *
         * `active` gates the loop; `owedLeg` remembers the flight we were about
         * to take so resuming picks up cleanly instead of stranding the camera
         * wherever it happened to be when the reader scrolled away.
         */
        let active = false
        let owedLeg: number | null = null

        const runLeg = (travelMs: number) => {
          if (cancelled) return
          if (!active) {
            owedLeg = travelMs
            return
          }
          owedLeg = null

          setMoving(true)
          /*
           * Stop the trace but leave the plot drawn.
           *
           * It is a real place on the ground, so it should recede with the
           * ground rather than blink out the moment the camera turns away —
           * the same reason the card no longer fades. It is cleared on arrival
           * instead, by which point it is far outside the frame.
           */
          stopParcel?.()
          map.flyTo({ ...legCamera(index), duration: travelMs, essential: true })

          legTimer = setTimeout(() => {
            if (cancelled) return

            // Arrived — only now is it honest to name the place.
            setCityIndex(index)
            setArrival((a) => a + 1)
            setMoving(false)
            parcelCentreRef.current = [...LAUNCH_MAP_CITIES[index].c] as [number, number]
            positionOverlay()
            // Now drop the previous plot — off-frame, so nothing is seen to go.
            clearParcel(map)
            stopParcel = animateParcel(map, index, () => !cancelled)

            /*
             * Restates the full target camera rather than only the bearing.
             *
             * Belt and braces: easeTo interrupts whatever flyTo was still doing,
             * so if the flight is ever cut short the rotation finishes the
             * descent as it sweeps instead of stranding the camera mid-air.
             * Naming center/zoom/pitch costs nothing when the flight did land —
             * they are already the current values, so nothing moves.
             */
            const target = legCamera(index)
            map.easeTo({
              center: target.center,
              zoom: target.zoom,
              pitch: target.pitch,
              bearing: target.bearing + INSPECT_ARC_DEG,
              duration: INSPECT_MS,
              easing: (t) => t, // linear — a constant sweep, not a lurch
              essential: true,
            })

            legTimer = setTimeout(() => {
              index = (index + 1) % LAUNCH_MAP_CITIES.length
              runLeg(TRAVEL_MS)
            }, INSPECT_MS + 300)
          }, travelMs)
        }

        const pause = () => {
          if (!active) return
          active = false
          if (legTimer) {
            clearTimeout(legTimer)
            legTimer = undefined
          }
          /* Cancels whatever flight is in progress. Without this the camera
             keeps easing — and Mapbox keeps rendering frames — after the
             timers have stopped. */
          map.stop()
          stopParcel?.()
          /* Re-fly the leg we were on rather than resuming a half-finished arc:
             the reader will be looking at a fresh approach either way. */
          owedLeg ??= TRAVEL_MS
        }

        const resume = () => {
          if (cancelled || active) return
          active = true
          const owed = owedLeg ?? TRAVEL_MS
          owedLeg = null
          runLeg(owed)
        }

        let onScreen = false
        const sync = () => {
          if (onScreen && !document.hidden) resume()
          else pause()
        }

        /* The first flight is the long one — the acquisition arc. Owed rather
           than called, so it starts when the panel is first seen. */
        owedLeg = ACQUIRE_MS

        const io = new IntersectionObserver(
          (entries) => {
            onScreen = entries.some((e) => e.isIntersecting)
            sync()
          },
          /* Any sliver counts. The panel is full-height, so by the time it is
             less than 1% visible it is genuinely gone. */
          { threshold: 0 },
        )
        io.observe(map.getContainer())
        document.addEventListener('visibilitychange', sync)

        releaseVisibility = () => {
          io.disconnect()
          document.removeEventListener('visibilitychange', sync)
        }
      })
    })
    }

    return () => {
      cancelled = true
      if (bootHandle !== undefined) {
        const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void })
          .cancelIdleCallback
        if (bootWasIdleCallback && typeof cic === 'function') cic(bootHandle)
        else clearTimeout(bootHandle)
      }
      if (legTimer) clearTimeout(legTimer)
      releaseVisibility?.()
      releaseMediaQuery?.()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // ── Waitlist ──
  async function submit(slot: 'hero' | 'close' = 'hero') {
    if (sending) return

    const result = classifyContact(entry, dial)
    if (!result.ok) {
      setError(t.rejects[result.reason])
      return
    }

    /*
     * Honeypot. Bots fill every field they find; a human never sees this one.
     * Answer as though it succeeded rather than showing an error — telling a
     * scripted submitter why it failed just helps it try again.
     */
    if (trapRef.current?.value) {
      setSubmitted(true)
      return
    }

    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: result.kind,
          value: result.value,
          dial,
          source: 'launch-tease',
          /* So the confirmation arrives in the language they read the page in. */
          lang,
          ref: referrerRef.current ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t.invalid)
        return
      }
      setCode(typeof data.code === 'string' ? data.code : null)
      setPosition(typeof data.position === 'number' ? data.position : null)
      setAlreadyJoined(data.alreadyJoined === true)
      setSubmitted(true)
      /* `kind` only — never the address or number itself. `position` is useful
         for seeing how fast the list is actually moving. */
      track('launch_signup_completed', 'launch-tease', {
        slot,
        lang,
        kind: result.kind,
        alreadyJoined: data.alreadyJoined === true,
        position: typeof data.position === 'number' ? data.position : null,
      })
    } catch {
      setError(t.network)
    } finally {
      setSending(false)
    }
  }

  const city = LAUNCH_MAP_CITIES[cityIndex]
  const launchMs = new Date(LAUNCH_DATE).getTime()
  /*
   * Whether the launch moment has passed.
   *
   * `now` is null until the first client tick, so this is false during SSR and
   * the first paint — which is what we want: the countdown renders, and only
   * disappears if the clock says it should. Deciding it on the server would
   * hydrate one state and then swap to another.
   *
   * clockParts already clamps at zero, so before this existed the countdown sat
   * at 0/0/0/0 under the words "Public launch in" while the offer above it
   * still promised a date in the past.
   */
  const launched = now !== null && now >= launchMs
  const parts = clockParts(now === null ? 0 : launchMs - now)
  const segments = [
    { value: parts.days, label: t.cdDays },
    { value: parts.hours, label: t.cdHours },
    { value: parts.mins, label: t.cdMins },
    { value: parts.secs, label: t.cdSecs },
  ]

  /*
   * What the field currently looks like it holds. Decided on the first
   * meaningful character: a digit or `+` means a number, anything else means an
   * address. Stays 'idle' while empty so the country code is not shown to
   * someone who is about to type an email.
   */
  const entryMode: 'idle' | 'phone' | 'email' = (() => {
    const first = entry.trim()[0]
    if (!first) return 'idle'
    if (entry.includes('@')) return 'email'
    return /[0-9+]/.test(first) ? 'phone' : 'email'
  })()

  /*
   * Whether what is typed would actually be accepted.
   *
   * The same function the submit handler and the API route run, so the button
   * can never light up for something the server will then reject. It is cheap
   * enough to run per keystroke — two regexes and a Set lookup.
   */
  const armed = classifyContact(entry, dial).ok

  const origin = typeof window === 'undefined' ? 'https://www.hatad.in' : window.location.origin
  const shareUrl = code ? `${origin}/?r=${code}` : ''

  async function copyShare() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      /*
       * Fired only after the write succeeds, so this counts links that actually
       * reached a clipboard rather than clicks on a button that silently failed.
       *
       * It measures intent, not reach — nothing here can see whether the link
       * was ever pasted anywhere. The event that closes that loop is
       * `referred: true` on launch_view, which is a real arrival on someone's
       * link. Read the two together.
       */
      track('launch_referral_shared', 'launch-tease', { lang })
    } catch {
      // Clipboard blocked (insecure origin, denied permission). The link is on
      // screen either way, so there is nothing to recover from.
    }
  }

  /*
   * The join block, rendered in two places: the hero and the close.
   *
   * A render function rather than a component, deliberately. A component
   * declared inside this one is a new type on every render, so React would
   * unmount and remount the form — losing focus and whatever had been typed —
   * on every keystroke. Inlined JSX shares the state above it for free.
   *
   * Ids have to be per-slot: `htmlFor`, `aria-describedby` and the input id all
   * pair up, and duplicating them would point both labels at the first field.
   */
  const renderJoin = (slot: 'hero' | 'close') => {
    const entryId = `lt-entry-${slot}`
    const noteId = `lt-note-${slot}`
    return (
        submitted ? (
          <div className="lt-done" role={slot === 'hero' ? 'status' : undefined}>
            <p style={{ margin: 0 }}>{alreadyJoined ? t.alreadyJoined : t.thanks}</p>

            {position !== null && (
              <p className="lt-done-pos">
                <span className="lt-done-pos-num">#{position}</span>
                <span className="lt-done-pos-label">{t.position}</span>
              </p>
            )}

            {/* Only offered when the queue is real — a share link that moves
                nobody up would be a lie. */}
            {code && (
              <>
                <p style={{ margin: '10px 0 0', color: '#3D5278' }}>{t.shareLead}</p>
                <div className="lt-share">
                  <span className="lt-share-link">{shareUrl}</span>
                  <button type="button" className="lt-copy" onClick={copyShare}>
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="lt-form">
            {/*
              The reason to join *now*, not at launch. Everything else here
              argues for the product; without this the strongest available
              reading is still "good, I'll come back when it opens".
            */}
            {/* One sentence per line rather than a wrapped paragraph. Both
                `balance` and `pretty` had to break mid-clause to fit this in
                two lines — "From 31 August you / can check", "a plot the /
                day" — and a sentence break beats every wrap the browser can
                choose. Observation, then mechanism, then the ask. */}
            <p className="lt-offer">
              <span className="lt-offer-lead">
                {slot === 'close' ? t.closeLead : t.offerLead}
              </span>
              <span className="lt-offer-body">
                {/* The closing copy carries no date, so it needs no expiry
                    branch — it reads the same the day before launch and the
                    week after. */}
                {slot === 'close'
                  ? t.closeBody
                  : launched
                    ? t.offerBodyLive
                    : t.offerBody(launchDay(lang === 'ta' ? 'ta-IN' : 'en-IN'))}
              </span>
              <span className="lt-offer-close">{t.offerClose}</span>
            </p>
            <div
              className="lt-field"
              data-error={!!error}
              data-mode={entryMode}
              data-armed={armed}
              data-sending={sending}
            >
              <label htmlFor={entryId} className="sr-only">
                {t.placeholder}
              </label>

              {/*
                Country code appears only once the input reads as a number.
                It is a real <select>, not a custom menu — native pickers are
                better on a phone, which is where most of these are typed.
              */}
              <span className="lt-dial" aria-hidden={entryMode !== 'phone'}>
                <select
                  aria-label="Country dialling code"
                  value={dial}
                  tabIndex={entryMode === 'phone' ? 0 : -1}
                  onChange={(e) => {
                    setDial(e.target.value)
                    if (error) setError(null)
                  }}
                >
                  {DIAL_CODES.map((c) => (
                    <option key={c.iso} value={c.dial}>
                      {c.iso} {c.dial}
                    </option>
                  ))}
                </select>
                <span className="lt-dial-shown">{dial}</span>
              </span>

              <input
                id={entryId}
                className="lt-input"
                value={entry}
                placeholder={t.placeholder}
                aria-invalid={!!error}
                aria-describedby={noteId}
                /*
                 * Mobile keyboard and autofill.
                 *
                 * The field had none of this, so a phone number was typed on a
                 * full QWERTY keyboard and the browser never offered a saved
                 * address — on a page whose readers are overwhelmingly on
                 * phones and whose only job is capture.
                 *
                 * `type` deliberately stays text. The field accepts either an
                 * address or a number, so type="email" or type="tel" would each
                 * be wrong half the time; inputMode drives the keyboard without
                 * imposing a type's validation or its parsing.
                 *
                 * Both follow entryMode, which is decided on the first
                 * character — so the keyboard switches to a numeric pad once it
                 * is clear a number is being typed, and autofill offers the
                 * right saved value rather than a generic one.
                 */
                inputMode={entryMode === 'phone' ? 'numeric' : entryMode === 'email' ? 'email' : 'text'}
                autoComplete={entryMode === 'phone' ? 'tel' : 'email'}
                /* The Enter key reads "go" instead of "return" — this form has
                   exactly one action and no next field to tab to. */
                enterKeyHint="go"
                /* iOS capitalises and "corrects" the first word by default,
                   which mangles an email address before it is even finished. */
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => {
                  if (e.target.value.trim()) noteStarted(slot)
                  setEntry(e.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit(slot)
                }}
              />
              {/* The arrow is its own element so it can travel on its own.
                  aria-hidden because it is punctuation, not a second word —
                  a screen reader announcing "Join right arrow" is worse. */}
              <button type="button" className="lt-join" onClick={() => submit(slot)} disabled={sending}>
                <span>{sending ? `${t.sending}…` : t.cta}</span>
                <span className="lt-join-arrow" aria-hidden>
                  →
                </span>
              </button>
            </div>

            {/*
              Honeypot — off-screen, unfocusable, hidden from assistive tech.
              Rendered in the hero copy only: there is one trapRef, and a second
              input claiming it would leave the ref pointing at whichever
              instance mounted last. One trap on the page is enough — a bot
              filling every field it finds will still find this one.
            */}
            {slot === 'hero' && (
              <input
                ref={trapRef}
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="lt-trap"
              />
            )}

            <p className="lt-note" id={noteId} data-error={!!error} role={error ? 'alert' : undefined}>
              {error || (entryMode === 'email' ? t.hintEmail : t.hint)}
            </p>
          </div>
        )
    )
  }

  /*
   * `lang` goes on the wrapper, not just on <html>.
   *
   * The root layout is a server component shared by every route and writes
   * lang="en" statically; making it locale-aware would mean reading headers,
   * which turns every page dynamic and costs the static prerender on all of
   * them. A lang attribute on the subtree is valid HTML, is what assistive tech
   * and crawlers actually read for this content, and is correct in the SSR
   * output for /ta. The effect above keeps document.documentElement in step
   * once the reader toggles.
   */
  return (
    <div className="lt-root" data-lang={lang} lang={lang}>
      <div className="lt-hero" ref={heroRef}>
      <header className="lt-head">
        <span className="lt-mark">HATAD</span>
        {/*
          Real links to real URLs, not buttons.
          A crawler needs an href to discover the other language, and a reader
          needs to be able to open or share it. The click handler still swaps
          in place — a soft navigation would remount this component and restart
          the map camera from the beginning, which is a poor trade for a change
          of copy. With JavaScript off, the href simply works.
        */}
        <div className="lt-lang">
          <a href="/" hrefLang="en" data-on={lang === 'en'} onClick={(e) => switchLang(e, 'en')}>
            EN
          </a>
          <span className="lt-lang-sep" aria-hidden>
            /
          </span>
          <a href="/ta" hrefLang="ta" data-on={lang === 'ta'} onClick={(e) => switchLang(e, 'ta')}>
            தமிழ்
          </a>
        </div>
      </header>

      <div className="lt-body">
        <section className="lt-panel-text lt-rise">
          <p className="lt-index">
            <span className="lt-index-num">01</span>
            <span className="lt-index-rule" aria-hidden />
            <span>{t.index} — Tamil Nadu</span>
          </p>

          <h1 className="lt-title">{t.head}</h1>
          <p className="lt-sub">{t.sub}</p>

          {renderJoin('hero')}

          {/* Second conversion path, sat beside the primary one on purpose:
              plenty of people will follow who won't hand over an email. Shown
              whether or not they joined — after signing up it is the next step. */}
          <div className="lt-follow">
            <span className="lt-follow-label">{t.follow}</span>
            {SOCIALS.map((s) => {
              const Icon = SOCIAL_ICONS[s.label]
              return (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                >
                  <Icon size={19} />
                </a>
              )
            })}
          </div>
        </section>

        <section className="lt-panel-map" aria-hidden>
          <div ref={mapContainerRef} className="lt-map" />

          <div className="lt-fix">
            <span className="lt-fix-label">
              <span className="lt-fix-dot" style={{ opacity: moving ? 0.25 : 1 }} />
              {t.fix}
            </span>
            <span>{city.name}</span>
            <span>
              {city.c[1].toFixed(4)}°N {city.c[0].toFixed(4)}°E
            </span>

          </div>

          {/* Anchored to the plot itself and re-positioned every frame, so the
              labels belong to the land rather than sitting in a panel beside it. */}
          {/*
            Shown from the first arrival onward and never hidden again.
            Anchoring it to the plot is the whole effect — so when the camera
            leaves, the annotation leaves with the land it belongs to and clips
            off the edge of the panel. Fading it out on departure broke that:
            the card stopped being part of the map and became an overlay that
            switches off.
          */}
          <div className="lt-scan" ref={scanOverlayRef} data-shown={arrival > 0}>
            {/* Keyed on arrival so the draw-in replays at every new plot —
                without a fresh key the CSS animation only ever runs once. */}
            <span className="lt-scan-lead" key={`lead-${arrival}`} />
            {/* Phone-only, and inert until positionOverlay() gives them a
                length and an angle. Rendered always rather than conditionally:
                a media query decides whether they are visible, so there is no
                second source of truth about which layout is in play. */}
            <span className="lt-scan-tether" aria-hidden />
            <span className="lt-scan-tip" aria-hidden />
            <div className="lt-scan-inner" key={`card-${arrival}`}>
              {scanSteps.map((step, i) => (
                <div key={step.label} className="lt-contents">
                  {i === 0 && (
                    <div className="lt-scan-sep" data-kind="base" data-state="on">
                      {t.baseLead}
                    </div>
                  )}
                  {/* The local block is announced once, right where it starts.
                      Without this the extra rows read as more of the same list
                      instead of as checks this location triggered. */}
                  {i === SCAN_STEPS_BASE.length && (
                    <div
                      className="lt-scan-sep"
                      data-kind="local"
                      data-state={scanStep >= i ? 'on' : 'off'}
                    >
                      {t.localLead(city.name)}
                    </div>
                  )}
                  <div
                    className="lt-scan-row"
                    data-state={i < scanStep ? 'done' : i === scanStep ? 'active' : 'pending'}
                  >
                    <span className="lt-scan-mark">
                      {i < scanStep ? '✓' : i === scanStep ? '·' : ''}
                    </span>
                    <span>
                      {step.label}
                      {step.why && <em className="lt-scan-why">{step.why}</em>}
                    </span>
                  </div>
                </div>
              ))}
              {/* Held back until the readout is on its last row, so it lands as
                  a closing note on a finished list rather than a caveat on an
                  empty one — but early enough to actually be read before the
                  camera departs. */}
              <div
                className="lt-scan-foot"
                data-state={scanStep >= scanSteps.length - 1 ? 'on' : 'off'}
              >
                {t.sample(scanSteps.length)}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="lt-hero-foot">
        {/*
          Removed rather than replaced once the moment passes.
          A countdown frozen at zero is worse than no countdown, and any
          substitute line would be announcing a launch this page cannot know has
          actually happened — the wall comes down by hand, in an env var. The
          scroll cue keeps its place on the right either way (.lt-cue carries
          margin-left:auto, so it does not slide left when left alone here).
        */}
        {!launched && (
        <div className="lt-cd">
          <span className="lt-foot-label">{t.goLive}</span>
          {/*
            The digits are aria-hidden with one static summary beside them.
            Marking every segment aria-live (as the reference markup does) makes
            a screen reader announce four numbers every second, which is unusable.
          */}
          <div className="lt-cd-row" aria-hidden>
            {segments.map((seg) => (
              <div className="lt-cd-seg" key={seg.label}>
                <span className="lt-cd-num">
                  {/*
                    One wheel per digit rather than one per number: only the units
                    wheel turns on most ticks, and the tens wheel moves just on
                    rollover — which is what an odometer actually does. Splitting
                    the padded string also means days can pass 99 without clipping.
                  */}
                  {pad(seg.value)
                    .split('')
                    .map((d, i) => (
                      <span
                        key={i}
                        className="lt-cd-digit"
                        style={{ '--d': now === null ? 0 : Number(d) } as React.CSSProperties}
                      />
                    ))}
                </span>
                <span className="lt-cd-lab">{seg.label}</span>
              </div>
            ))}
          </div>
          <span className="sr-only">
            {t.goLive} {parts.days} {t.cdDays}
          </span>
        </div>
        )}
        <span className="lt-cue">
          <span className="lt-cue-num">02</span>
          <span>{t.sourcesIndex}</span>
          <span aria-hidden>↓</span>
        </span>
      </div>
      </div>

      <DepartmentDescent
        labels={{
          index: '02',
          lead: t.sourcesIndex,
          of: t.sourcesOf,
          close: t.sourcesClose,
          closeSub: t.sourcesCloseSub,
        }}
      />

      <section className="lt-block">
        <p className="lt-block-index">
          <span className="lt-block-index-num">03</span>
          <span className="lt-block-rule" aria-hidden />
          <span>{t.coverageIndex}</span>
        </p>
        <h2 className="lt-block-title">{t.coverageTitle}</h2>

        {/* Every figure counted from the SRO table, never typed into copy. */}
        <CoverageCount
          total={coverage.villages}
          label={t.ccVillages}
          facts={[
            { value: String(coverage.sros), label: t.ccSro },
            { value: String(coverage.districts), label: t.ccDistricts },
            { value: String(coverage.zones), label: t.ccZones },
          ]}
        />

        {/* Named in full rather than summarised — the list is the proof. */}
        <ul className="lt-districts">
          {LAUNCH_DISTRICTS.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      {/* Unnumbered on purpose — a moment between chapters, not another one. */}
      <ScrollReveal
        containerClassName="tr"
        textClassName="tr-line"
        baseOpacity={0}
        enableBlur
        /*
         * No rotation.
         *
         * Rotating the block widens its own bounding box by roughly
         * height x sin(angle) — 10px even at 2deg — which overflowed the
         * viewport and put a horizontal scrollbar across the bottom of the
         * entire page. Clipping does not help: overflow clips an element's
         * children, not its own transform.
         *
         * It was also the weakest part of the effect. Against the hairline
         * rules running across the rest of the page, a tilted block reads as a
         * rendering fault rather than a flourish. The blur and the opacity
         * carry the reveal on their own.
         */
        baseRotation={0}
        blurStrength={8}
      >
        {t.line}
      </ScrollReveal>

      {/*
        Sits immediately after the thesis line and before the questions, which
        is where the reader has just been told what we do and has not yet been
        given a reason to believe anyone can. Unnumbered, like the line above
        it — the chapters are the argument, this is a credential.
      */}
      <section className="lt-cred">
        <div className="lt-cred-grid">
          <div className="lt-cred-item" data-mark="nvidia">
            <span className="lt-cred-plate">
              {/* 501x217 is the asset's true size. The marketing-site version
                  declares 180x180 and letterboxes it with object-contain, which
                  makes Next generate a square it then has to pad. */}
              <Image
                src="/nvidia-inception-program-badge-rgb-for-screen.png"
                alt="NVIDIA Inception Program"
                width={501}
                height={217}
              />
            </span>
            <p className="lt-cred-label">
              <span className="lt-cred-dot" aria-hidden />
              {t.nvLabel}
            </p>
            <h2 className="lt-cred-title">{t.nvTitle}</h2>
            <p className="lt-cred-body">{t.nvBody}</p>
            <p className="lt-cred-meta">{t.nvMeta}</p>
          </div>

          <div className="lt-cred-item" data-mark="shaastra">
            <span className="lt-cred-plate">
              <Image
                src="/iitm-shaastra-logo.jpg"
                alt="IIT Madras Shaastra"
                width={319}
                height={319}
              />
            </span>
            <p className="lt-cred-label">
              <span className="lt-cred-dot" aria-hidden />
              {t.shLabel}
            </p>
            <h2 className="lt-cred-title">{t.shTitle}</h2>
            <p className="lt-cred-body">{t.shBody}</p>
            <p className="lt-cred-meta">{t.shMeta}</p>
          </div>
        </div>
      </section>

      <section className="lt-block">
        <p className="lt-block-index">
          <span className="lt-block-index-num">04</span>
          <span className="lt-block-rule" aria-hidden />
          <span>{t.questionsIndex}</span>
        </p>
        <h2 className="lt-block-title">{t.questionsTitle}</h2>
        <div className="lt-faq">
          {t.faq.map((item) => (
            <div className="lt-faq-item" key={item.q}>
              <p className="lt-faq-q">{item.q}</p>
              <p className="lt-faq-a">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who the visitor is handing their details to. */}
      {/*
        The closing ask.
        The form used to appear exactly once, above the fold — so a reader who
        scrolled the descent, the coverage count, the thesis and the questions
        arrived at the point of maximum conviction with nothing to act on but a
        scroll back to the top. Same copy as the hero deliberately: the offer
        has not changed on the way down, and inventing a second version of it
        would mean a second claim to keep true.
      */}
      <section className="lt-close" aria-label={t.index}>
        <div>{renderJoin('close')}</div>
        <ConvergenceDiagram />
      </section>

      <div className="lt-trust">
        <span className="lt-trust-name">{COMPANY.legalName}</span>
        {COMPANY.city}, {COMPANY.region} ·{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ·{' '}
        <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>
        <br />
        {SOCIALS.map((s, i) => (
          <span key={s.href}>
            {i > 0 && ' · '}
            <a href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </span>
        ))}
        <br />
        {t.trustPrivacy}
      </div>

      {/* The countdown lives in the hero — this is just the legal footer. */}
      <footer className="lt-foot">
        <span style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <span>
            ©{' '}
            <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer">
              Mapbox
            </a>{' '}
            ©{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              OpenStreetMap
            </a>
          </span>
        </span>
      </footer>
    </div>
  )
}
