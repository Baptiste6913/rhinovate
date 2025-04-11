
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out py-4 px-6 lg:px-10',
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/5da6ab51-f387-4ff4-a643-49a748b49302.png" 
              alt="Rhinovate Logo" 
              className="h-12" 
            />
            <span className="font-display text-2xl font-semibold tracking-tight text-rhinovate-900 hidden sm:inline">
              Rhinovate
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-sm font-medium text-gray-700 hover:text-rhinovate-600 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-rhinovate-600 transition-colors">
            How It Works
          </a>
          <a href="#testimonials" className="text-sm font-medium text-gray-700 hover:text-rhinovate-600 transition-colors">
            Testimonials
          </a>
          <Link to="/about" className="text-sm font-medium text-gray-700 hover:text-rhinovate-600 transition-colors">
            À propos
          </Link>
          <Link to="/news" className="text-sm font-medium text-gray-700 hover:text-rhinovate-600 transition-colors">
            News
          </Link>
          <a href="#contact" className="rhinovate-btn-primary">
            Request Demo
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-white pt-24 px-6 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col space-y-8 items-center">
          <a 
            href="#features" 
            className="text-lg font-medium text-gray-700 hover:text-rhinovate-600 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="text-lg font-medium text-gray-700 hover:text-rhinovate-600 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            How It Works
          </a>
          <a 
            href="#testimonials" 
            className="text-lg font-medium text-gray-700 hover:text-rhinovate-600 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Testimonials
          </a>
          <Link 
            to="/about" 
            className="text-lg font-medium text-gray-700 hover:text-rhinovate-600 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            À propos
          </Link>
          <Link 
            to="/news" 
            className="text-lg font-medium text-gray-700 hover:text-rhinovate-600 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            News
          </Link>
          <a 
            href="#contact" 
            className="rhinovate-btn-primary w-full text-center"
            onClick={() => setIsOpen(false)}
          >
            Request Demo
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
