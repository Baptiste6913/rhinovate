
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    content: "Rhinovate transformed my practice. Patients can now see their potential results and healing timeline with remarkable accuracy, boosting conversion rates and reducing post-op anxiety calls by 70%.",
    title: "Facial Plastic Surgeon",
    location: "Beverly Hills Aesthetics",
    avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
  },
  {
    content: "As a clinic manager, I've seen consultation-to-surgery conversion rates increase by 35% since implementing Rhinovate. The visualization tools create realistic expectations and significantly reduce patient hesitation.",
    title: "Practice Manager",
    location: "Miami Facial Institute",
    avatar: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7"
  },
  {
    content: "The 3D healing timeline feature has dramatically reduced our post-op support calls. Patients know exactly what to expect at each stage of recovery, creating a smoother experience for everyone involved.",
    title: "ENT Specialist",
    location: "Advanced Rhinoplasty Center",
    avatar: "https://images.unsplash.com/photo-1498050108023-c5249f4df085"
  }
];

const Testimonials = () => {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const next = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((current + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((current - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      next();
    }, 8000);
    return () => clearInterval(interval);
  }, [current]);

  return (
    <section id="testimonials" className="section-padding bg-rhinovate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="text-sm font-medium text-rhinovate-600 uppercase tracking-wider">Testimonials</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold tracking-tight text-gray-900 sm:text-5xl text-balance">
            Trusted by Leading Surgeons
          </h2>
          <p className="mt-6 text-lg text-gray-600 text-balance">
            See how Rhinovate is transforming practices and enhancing the patient experience
            for top clinics across the country.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className={`flex transition-transform duration-500 ease-in-out ${isAnimating ? 'opacity-80' : 'opacity-100'}`} 
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
                    <div className="flex items-center mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-xl md:text-2xl font-medium text-gray-800 mb-8 leading-relaxed text-balance">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.title} 
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.title}</p>
                        <p className="text-rhinovate-600 text-sm">{testimonial.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAnimating(true);
                  setCurrent(index);
                  setTimeout(() => setIsAnimating(false), 500);
                }}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  current === index ? 'bg-rhinovate-600 w-8' : 'bg-gray-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Arrow Navigation */}
          <button
            onClick={prev}
            className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg text-gray-600 hover:text-rhinovate-600 transition-colors focus:outline-none"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg text-gray-600 hover:text-rhinovate-600 transition-colors focus:outline-none"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
