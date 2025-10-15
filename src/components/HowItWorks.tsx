import React, { useState, useEffect, useRef } from 'react';
import { Camera, SlidersHorizontal, Box, Calendar, ShieldCheck, BadgeCheck, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Tab = 'patients' | 'surgeons';

interface Step {
  number: string;
  title: string;
  description: string;
  supportText: string;
  icon: React.ElementType;
}

const patientsSteps: Step[] = [
  {
    number: '01',
    title: 'Quick 3D scan',
    description: 'Use your phone to capture a short scan - no special hardware needed.',
    supportText: 'Our pipeline turns it into a precise 3D model in seconds.',
    icon: Camera,
  },
  {
    number: '02',
    title: 'Set your goals',
    description: 'Tell us what you would like to refine.',
    supportText: 'Landmarks and proportions help translate preferences into clear options.',
    icon: SlidersHorizontal,
  },
  {
    number: '03',
    title: 'See your future self',
    description: 'Preview realistic, adjustable 3D outcomes from every angle.',
    supportText: 'Make small tweaks live until it feels right.',
    icon: Box,
  },
  {
    number: '04',
    title: 'Preview healing',
    description: 'Scrub through Week 1 to Month 6 to understand bruising and swelling.',
    supportText: 'Know what is normal at each stage before day one.',
    icon: Calendar,
  },
];

const surgeonsSteps: Step[] = [
  {
    number: '01',
    title: 'Capture & import',
    description: 'Scan with a phone or clinic device; import photos if preferred.',
    supportText: 'Automatic landmarking and mesh generation - no rigs, no fuss.',
    icon: Camera,
  },
  {
    number: '02',
    title: 'Plan together',
    description: 'Define targets with the patient in real time.',
    supportText: 'Precise controls, measurements, and side-by-side comparisons.',
    icon: SlidersHorizontal,
  },
  {
    number: '03',
    title: 'Predictive visualization',
    description: 'Show plausible outcomes your patients can trust.',
    supportText: 'Powered by Rhinovate Diffusion Engine, 3D Mesh Generator, and Healing Forecast Model.',
    icon: Box,
  },
  {
    number: '04',
    title: 'Educate & align',
    description: 'Set expectations with a staged healing timeline.',
    supportText: 'Reduce FAQs, improve consent quality, and cut revision risk drivers.',
    icon: Calendar,
  },
];

const healingStages = [
  { label: 'Week 1', value: 0, caption: 'Expected swelling: moderate' },
  { label: 'Month 1', value: 33, caption: 'Expected swelling: mild' },
  { label: 'Month 3', value: 66, caption: 'Expected swelling: minimal' },
  { label: 'Month 6', value: 100, caption: 'Expected swelling: fully resolved' },
];

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState<Tab>('patients');
  const [healingStage, setHealingStage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Load tab preference from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('rhinovate-how-it-works-tab');
    if (savedTab === 'patients' || savedTab === 'surgeons') {
      setActiveTab(savedTab);
    }
  }, []);

  // Save tab preference to localStorage
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem('rhinovate-how-it-works-tab', tab);
  };

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Respect reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const currentSteps = activeTab === 'patients' ? patientsSteps : surgeonsSteps;
  const currentStageData = healingStages.find(s => s.value === healingStage) || healingStages[0];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-16 md:py-24 px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-white via-rhinovate-50/30 to-white"
      aria-labelledby="how-it-works-heading"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(148,163,184,0.08),transparent_50%)]" aria-hidden="true" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 
            id="how-it-works-heading"
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-4"
          >
            How it works
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            From a quick 3D scan to a realistic healing timeline - so patients and surgeons make decisions with confidence.
          </p>
        </div>

        {/* Tab Switcher */}
        <div 
          className="flex justify-center mb-12"
          role="tablist"
          aria-label="User type selection"
        >
          <div className="inline-flex rounded-2xl bg-white/60 backdrop-blur-sm p-1.5 shadow-sm border border-gray-200/50">
            <button
              role="tab"
              aria-selected={activeTab === 'patients'}
              aria-controls="patients-panel"
              onClick={() => handleTabChange('patients')}
              className={`px-6 md:px-8 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'patients'
                  ? 'bg-white text-rhinovate-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Patients
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'surgeons'}
              aria-controls="surgeons-panel"
              onClick={() => handleTabChange('surgeons')}
              className={`px-6 md:px-8 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'surgeons'
                  ? 'bg-white text-rhinovate-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Surgeons
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div
          id={`${activeTab}-panel`}
          role="tabpanel"
          aria-labelledby={`${activeTab}-tab`}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16"
        >
          {currentSteps.map((step, index) => {
            const Icon = step.icon;
            const delay = prefersReducedMotion ? 0 : index * 100;
            
            return (
              <div
                key={step.number}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-7 shadow-sm hover:shadow-md transition-all border border-gray-100/50 ${
                  isVisible && !prefersReducedMotion ? 'animate-fade-in' : ''
                }`}
                style={!prefersReducedMotion ? { animationDelay: `${delay}ms` } : {}}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-rhinovate-100 flex items-center justify-center">
                    <span className="text-2xl font-display font-bold text-rhinovate-600">
                      {step.number}
                    </span>
                  </div>
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-rhinovate-50 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-rhinovate-600" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-700 mb-2">
                  {step.description}
                </p>
                <p className="text-sm text-gray-500">
                  {step.supportText}
                </p>
              </div>
            );
          })}
        </div>

        {/* Healing Timeline Demo */}
        <div className="mb-12 md:mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100/50 max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
              Interactive Healing Timeline
            </h3>
            
            {/* Timeline scrubber */}
            <div className="mb-6">
              <div className="relative h-2 bg-gray-200 rounded-full">
                <div 
                  className="absolute h-full bg-rhinovate-500 rounded-full transition-all"
                  style={{ width: `${healingStage}%` }}
                  aria-hidden="true"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={healingStage}
                  onChange={(e) => setHealingStage(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Healing timeline scrubber"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={healingStage}
                  aria-valuetext={currentStageData.label}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-rhinovate-500 rounded-full shadow-md transition-all"
                  style={{ left: `calc(${healingStage}% - 10px)` }}
                  aria-hidden="true"
                />
              </div>
              
              {/* Stage markers */}
              <div className="flex justify-between mt-4">
                {healingStages.map((stage) => (
                  <button
                    key={stage.value}
                    onClick={() => setHealingStage(stage.value)}
                    className="text-xs md:text-sm font-medium text-gray-600 hover:text-rhinovate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rhinovate-500 focus:ring-offset-2 rounded px-1"
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage info */}
            <div className="text-center">
              <p className="text-sm md:text-base text-gray-600">
                {currentStageData.caption}
              </p>
              <div className="mt-4 h-32 bg-gradient-to-b from-rhinovate-50 to-rhinovate-100/50 rounded-xl flex items-center justify-center">
                <p className="text-sm text-gray-500 italic">3D visualization placeholder</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Row */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10 md:mb-12">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-rhinovate-600" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">Clinic-grade security</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm">
            <BadgeCheck className="w-4 h-4 text-rhinovate-600" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">HIPAA-style privacy</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm">
            <Cpu className="w-4 h-4 text-rhinovate-600" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">No extra hardware</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {activeTab === 'patients' ? (
            <>
              <Button
                size="lg"
                asChild
                data-cta="waitlist"
                className="w-full sm:w-auto"
              >
                <a href="/#waitlist">Join the waitlist</a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                data-cta="sample"
                className="w-full sm:w-auto"
              >
                <a href="/sample">See a sample simulation</a>
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                asChild
                data-cta="demo"
                className="w-full sm:w-auto"
              >
                <a href="/demo">Request a demo</a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                data-cta="tech"
                className="w-full sm:w-auto"
              >
                <a href="/tech">View technical overview</a>
              </Button>
            </>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center mt-8 max-w-2xl mx-auto">
          Simulations are estimates, not medical guarantees.
        </p>
      </div>
    </section>
  );
};

export default HowItWorks;
