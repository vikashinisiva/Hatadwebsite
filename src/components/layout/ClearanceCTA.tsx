import Link from 'next/link'
import { COMING_SOON } from '@/lib/constants'
import { SOURCE_CLAIM } from '@/lib/departments'

/**
 * The call to action, correct in both states of the site.
 *
 * Every page below the launch page linked to "/" with waitlist copy. That is
 * right today, because the proxy rewrites "/" to the waitlist. It stops being
 * right the moment COMING_SOON comes off: "/" silently becomes the product
 * landing page, and 39 district pages would go on inviting people to join a
 * waitlist that no longer exists, pointing at a page selling a report.
 *
 * Nothing would have failed, nothing would have warned. So the decision is made
 * here, once, rather than left as a launch-day task on 39 pages.
 *
 * After launch it also skips the home page entirely. Somebody who searched for
 * their district and landed on its page is already qualified and already
 * thinking about a specific place; sending them to a generic homepage to start
 * again throws that away. The district is passed straight into onboarding,
 * which already reads `?district=`.
 */
export function ClearanceCTA({ district }: { district?: string }) {
  const href = COMING_SOON
    ? '/'
    : district
      ? `/clearance/onboarding?district=${encodeURIComponent(district)}`
      : '/clearance/onboarding'

  const heading = COMING_SOON
    ? district
      ? `Check a ${district} survey number before you pay`
      : 'Check a survey number before you pay'
    : district
      ? `Start a ${district} clearance`
      : 'Start a clearance'

  const action = COMING_SOON ? 'Join the waitlist' : 'Check a survey number'

  return (
    <div className="mt-14 bg-[#0C1525] text-white p-8">
      <p className="font-serif text-2xl font-semibold mb-2">{heading}</p>
      <p className="text-[15px] text-[#B8C5DA] max-w-[48ch]">
        One report across {SOURCE_CLAIM} government departments and courts, with the source named for
        every finding, so your advocate can verify it independently.
        {COMING_SOON && ' We open at launch; the waitlist hears first.'}
      </p>
      <Link
        href={href}
        className="inline-block mt-6 bg-[#C9A84C] text-[#0C1525] font-bold text-sm px-6 py-3 rounded-sm"
      >
        {action}
      </Link>
    </div>
  )
}

/**
 * The masthead action. Same reasoning as {@link ClearanceCTA}: it was a
 * hard-coded "Join the waitlist" pointing at "/" on four pages, which would
 * have gone on inviting people to a waitlist that closed at launch.
 */
export function NavCTA() {
  return (
    <Link
      href={COMING_SOON ? '/' : '/clearance/onboarding'}
      className="text-xs font-medium text-accent-blue border border-border rounded-sm px-3 py-1.5 bg-white"
    >
      {COMING_SOON ? 'Join the waitlist' : 'Check a survey number'}
    </Link>
  )
}
