
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  const [showEmailInput, setShowEmailInput] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('staggered-animation');
        }
      },
      {
        root: null,
        threshold: 0.1,
      }
    );
    
    if (heroRef.current) {
      observer.observe(heroRef.current);
    }
    
    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Thank you for your interest!",
        description: "We'll notify you when the demo becomes available.",
      });
      setEmail('');
      setShowEmailInput(false);
    } else {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-white to-rhinovate-50 pt-32 pb-16 md:pt-40 md:pb-32">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-rhinovate-100 opacity-50 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-blue-100 opacity-40 blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div ref={heroRef} className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-rhinovate-100 px-4 py-1.5 text-sm font-medium text-rhinovate-800 mb-8">
            <span className="mr-1.5 flex h-2 w-2 rounded-full bg-rhinovate-500"></span>
            Revolutionizing Rhinoplasty Visualization
          </span>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-gray-900 mb-6 text-balance">
            See Your Perfect Nose <span className="text-rhinovate-600">Before Surgery</span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl leading-8 text-gray-600 max-w-3xl mx-auto text-balance">
            Rhinovate uses AI-powered 3D visualization to show realistic before-and-after results and predict your entire healing journey. Eliminate uncertainty and make confident decisions.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            <a href="#contact" className="rhinovate-btn-primary group">
              Schedule a Demo
              <ArrowRight className="inline ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#how-it-works" className="rhinovate-btn-secondary">
              See How It Works
            </a>
          </div>
          
          {/* Patient Email Collection Section */}
          <div className="mt-8">
            {!showEmailInput ? (
              <button 
                onClick={() => setShowEmailInput(true)}
                className="flex items-center justify-center mx-auto py-2 px-4 text-rhinovate-600 border border-rhinovate-300 rounded-lg hover:bg-rhinovate-50 transition-colors"
              >
                <Mail className="mr-2 h-4 w-4" />
                Get notified when the demo is available
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rhinovate-500"
                  required
                />
                <button 
                  type="submit"
                  className="rhinovate-btn-primary whitespace-nowrap"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>
          
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm leading-6 text-gray-600">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-rhinovate-500 mr-2" />
              Hyper-realistic AI visualizations
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-rhinovate-500 mr-2" />
              3D predictive healing timeline
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-rhinovate-500 mr-2" />
              For surgeons and clinics
            </div>
          </div>
        </div>

        <div className="mt-16 sm:mt-24 relative mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-xl shadow-2xl">
            <div className="image-loading">
              <img
                src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
                alt="Rhinovate 3D Visualization Dashboard"
                className="w-full h-auto object-cover aspect-[16/9]"
                loading="lazy"
              />
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-8">
              <div className="text-white">
                <p className="text-sm font-medium mb-1">Rhinovate Visualization Platform</p>
                <h3 className="text-xl font-semibold">Surgeon Dashboard with Patient Timeline</h3>
              </div>
            </div>
          </div>

          {/* Floating Accent Elements */}
          <div className="absolute -top-6 -right-6 bg-rhinovate-500 rounded-lg shadow-lg p-2 rotate-3 animate-float">
            <div className="bg-white rounded-md p-2 text-xs font-medium">
              2-Week Recovery Progress
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 bg-white rounded-lg shadow-lg p-2 -rotate-3 animate-float animation-delay-1000">
            <div className="flex items-center space-x-2 text-xs font-medium text-rhinovate-800">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>98% Patient Satisfaction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
