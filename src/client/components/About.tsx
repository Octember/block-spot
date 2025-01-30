import { Link as WaspRouterLink, routes } from "wasp/client/router";

export default function About() {
  return (

    <div className="max-w-2xl md:max-w-4xl mx-auto py-8 px-4">

      <h2 className="text-2xl font-bold mb-6">About BlockSpot</h2>

      <div className="prose dark:prose-invert  space-y-12">
        {/* Introduction */}
        <section>
          <p className="text-lg leading-relaxed">
            At BlockSpot, we believe scheduling shouldn&apos;t be a chore—or a luxury. Too many tools overwhelm with flashy features you&apos;ll never use, while others cut corners on quality to hit a price point. We built something different: a scheduling app designed for working professionals, by working professionals. No fluff. No complexity. Just intuitive design, seamless functionality, and pricing that respects your budget.
          </p>
        </section>

        {/* Mission */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg leading-relaxed">
            The modern workday is fragmented enough. You shouldn&apos;t need a manual to coordinate meetings, juggle client bookings, or carve out time for what matters. BlockSpot strips away the excess, focusing on what you actually need: a clean interface that works the way you do, robust features that handle the details, and reliability you can count on. We&apos;re here to simplify your workflow, not complicate it.
          </p>
        </section>

        {/* Why Choose Us */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Why Choose BlockSpot?</h2>
          <div className="grid gap-6">
            <div className="bg-cyan-50 dark:bg-gray-800 px-6  rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Premium Quality, Not Premium Prices</h3>
              <p>Premium tools shouldn&apos;t demand premium prices. We&apos;ve engineered BlockSpot to deliver exceptional value without hidden fees or tiers.</p>
            </div>
            <div className="bg-cyan-50 dark:bg-gray-800 px-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">UX That Feels Effortless</h3>
              <p>Every button, calendar view, and notification is crafted with care. If it&apos;s not intuitive, it doesn&apos;t make the cut.</p>
            </div>
            <div className="bg-cyan-50 dark:bg-gray-800 px-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">For Professionals, By Professionals</h3>
              <p>Built by a team who&apos;s lived the chaos of double-booked days and last-minute changes. We know what you need because we&apos;ve needed it too.</p>
            </div>
          </div>
        </section>

        {/* Less Frills, More Focus */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Less Frills, More Focus</h2>
          <p className="text-lg leading-relaxed mb-6">
            BlockSpot isn&apos;t about bells and whistles. It&apos;s about giving you back the hours lost to clunky interfaces, overpriced subscriptions, and tools that overpromise. Whether you&apos;re coordinating team shifts, managing client appointments, or balancing side hustles, we&apos;ve designed an experience that stays out of your way—so you can stay in control.
          </p>
          <p className="text-lg leading-relaxed">
            Join thousands of professionals who&apos;ve already reclaimed their time. BlockSpot: Scheduling simplified, priced fairly, built to last.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center pb-8">
          <h2 className="text-2xl font-bold mb-6">Ready to focus on what matters?</h2>
          <WaspRouterLink
            to={routes.SignupRoute.to}
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
          >
            Let&apos;s Get Started
          </WaspRouterLink>
        </section>
      </div>
    </div>

  );
} 