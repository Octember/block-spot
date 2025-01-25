import FAQ from "./components/FAQ";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import {
  faqs,
  features,
  footerNavigation
} from "./contentSections";

export default function LandingPage() {
  return (
    <div className="bg-white dark:text-white dark:bg-boxdark-2">
      <main className="isolate dark:bg-boxdark-2">
        <Hero />
        <Features features={features} />
        <FAQ faqs={faqs} />
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}
