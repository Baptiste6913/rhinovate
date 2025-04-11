
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Separator } from '@/components/ui/separator';

interface ComingSoonProps {
  title: string;
}

export const Comingsoon: React.FC<ComingSoonProps> = ({ title }) => {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-rhinovate-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-rhinovate-900 mb-6 font-display">
            {title}
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-6">
            This page is coming soon. We're working hard to bring you amazing content.
          </p>
          <Separator className="w-24 h-1 bg-rhinovate-600 mx-auto" />
        </div>
      </section>

      {/* Coming Soon Content */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">We're working on something exciting!</h2>
          <p className="text-lg text-gray-600 mb-8">
            Our team is putting the finishing touches on this page. 
            Check back soon for updates or subscribe to our newsletter to be notified when it's ready.
          </p>
          
          <div className="mt-12">
            <a 
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-rhinovate-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-rhinovate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rhinovate-600"
            >
              Return to Home
            </a>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default Comingsoon;
