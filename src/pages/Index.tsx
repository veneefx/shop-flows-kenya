import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaBanner from "@/components/landing/CtaBanner";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <ReviewsSection />
        <FaqSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
