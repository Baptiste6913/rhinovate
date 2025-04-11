
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

const Team = () => {
  const teamMembers = [
    {
      name: 'Stanley T Ndlovu',
      role: 'Software Engineer',
      image: '/lovable-uploads/acf5c08d-99bb-416b-b4c6-8aa0e1ecc9f8.png',
      bio: 'Developing cutting-edge AI algorithms for medical imaging analysis with expertise in computer vision and deep learning frameworks.'
    },
    {
      name: 'Baptiste BOUAULT',
      role: 'Chief Financial Officer',
      image: '/lovable-uploads/ce251ab4-626a-4d4d-bc8b-082b941e2bd5.png',
      bio: 'Managing financial strategy and operations with a background in healthcare investment and startup financing.'
    },
    {
      name: 'Deesha Pathak',
      role: 'Chief Executive Officer',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1588&auto=format&fit=crop',
      bio: 'Leading Rhinovate with a passion for combining healthcare innovation and cutting-edge technology to improve patient outcomes.'
    },
    {
      name: 'Haris Rahim',
      role: 'Product Manager',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1587&auto=format&fit=crop',
      bio: 'Crafting intuitive user experiences for complex medical technologies with a focus on patient-centered design principles.'
    },
    {
      name: 'Ronit Prakash',
      role: 'Data Scientist',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1587&auto=format&fit=crop',
      bio: 'Leveraging large healthcare datasets to enhance our AI models with expertise in statistical analysis and machine learning.'
    }
  ];

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-rhinovate-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-rhinovate-900 mb-6 font-display">
            Meet Our Team
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-6">
            We're a passionate group of Berkeley graduates combining technology and medicine to revolutionize rhinoplasty.
          </p>
          <Separator className="w-24 h-1 bg-rhinovate-600 mx-auto" />
        </div>
      </section>

      {/* Team Members Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <CardContent className="pt-6 text-center">
                  <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                  <p className="text-rhinovate-600 font-medium italic mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Join Our Team Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-rhinovate-50 to-blue-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-rhinovate-900 mb-6">Join Our Team</h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            We're looking for passionate individuals who want to make a difference in healthcare technology.
            Check out our current openings or send us your resume.
          </p>
          <a 
            href="#careers" 
            className="inline-flex items-center justify-center rounded-md bg-rhinovate-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-rhinovate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rhinovate-600"
          >
            View Open Positions
          </a>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default Team;
