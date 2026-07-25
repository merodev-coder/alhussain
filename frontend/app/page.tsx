import StoreLayout from '@/components/store-layout'
import HeroSection from '@/components/home/hero-section'
import FeaturedSection from '@/components/home/featured-section'
import PromoSection from '@/components/home/promo-section'
import TrustSection from '@/components/home/trust-section'

export default function HomePage() {
  return (
    <StoreLayout>
      <HeroSection />
      <FeaturedSection />
      <PromoSection />
      <TrustSection />
    </StoreLayout>
  )
}
