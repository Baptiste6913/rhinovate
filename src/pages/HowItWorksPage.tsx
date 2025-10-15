import React from 'react';
import Navbar from '@/components/Navbar';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
