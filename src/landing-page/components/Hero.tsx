import openSaasBannerWebp from "../../client/static/banner.webp";

export default function Hero() {
  return (
    <div className="relative pt-14 w-full">
      <div className="pt-24 sm:pt-32 pb-16">
        <div className="mx-auto max-w-8xl px-6 lg:px-8">
          <div className="lg:mb-18 mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl dark:text-white">
              Simple Bookings.
            </h1>
            <h1 className="text-4xl mt-4 font-bold text-gray-900 sm:text-6xl dark:text-white">
              <span className="italic">Happier</span> Customers.
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-lg leading-8 text-gray-600 dark:text-white">
              Save time, reduce chaos, and grow your business with an
              <br /> intuitive reservation tool designed for small teams.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href={"/signup"}
                className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-200 bg-white hover:ring-2 hover:ring-teal-600 hover:bg-teal-50 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-white"
              >
                Get Started in Minutes <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="mt-14 flow-root sm:mt-14">
            <div className="-m-2  flex justify-center rounded-xl lg:-m-4 lg:rounded-2xl lg:p-4">
              <img
                src={openSaasBannerWebp}
                alt="App screenshot"
                width={1000}
                height={530}
                loading="lazy"
                className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
              />
            </div>
          </div>

          <div className="mx-auto  mt-14 max-w-2xl text-center">
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
              Streamline Your{" "}
              <span className="text-teal-700">Reservations</span>
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-white">
              No clunky interfaces. No overpriced plans. Just a straightforward
              tool to manage your spaces, delight customers, and reclaim your
              day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
