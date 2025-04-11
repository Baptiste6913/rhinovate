
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Shield, Lightbulb, Heart, Award, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const teamMembers = [
    {
      name: 'Dr. Alex Chen',
      role: 'CEO & Co-Fondateur',
      bio: 'Expert en IA et étudiant en médecine, Alex associe sa passion pour la tech et la santé.',
      image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=1740&auto=format&fit=crop'
    },
    {
      name: 'Sarah Martinez',
      role: 'CTO & Co-Fondatrice',
      bio: 'Spécialiste en vision par ordinateur et modélisation 3D avec un diplôme en informatique.',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1522&auto=format&fit=crop'
    },
    {
      name: 'David Wang',
      role: 'Directeur Produit',
      bio: 'Passionné par l\'UX et la santé numérique, avec une formation en design et en santé publique.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1587&auto=format&fit=crop'
    },
    {
      name: 'Priya Patel',
      role: 'Responsable Marketing',
      bio: 'Experte en stratégies de croissance pour startups médicales avec un MBA de Berkeley.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1588&auto=format&fit=crop'
    },
    {
      name: 'Michael Lee',
      role: 'Ingénieur IA',
      bio: 'Chercheur en intelligence artificielle spécialisé dans l\'analyse d\'images médicales.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1587&auto=format&fit=crop'
    }
  ];

  const values = [
    {
      icon: Shield,
      title: 'Transparence',
      description: 'Nous croyons à une communication claire et honnête avec les patients et les chirurgiens.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Nous repoussons constamment les limites de la technologie pour améliorer les soins de santé.'
    },
    {
      icon: Heart,
      title: 'Empathie',
      description: 'Nous plaçons l\'expérience et le bien-être du patient au cœur de nos solutions.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Nous visons la plus haute qualité dans nos produits, services et interactions.'
    }
  ];

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-rhinovate-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-rhinovate-900 mb-6 font-display">
            Transformer l'expérience de la rhinoplastie grâce à l'IA
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-12">
            Nous rendons la chirurgie esthétique plus transparente, prédictive et rassurante pour les patients et les chirurgiens.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-rhinovate-800 mb-6">Notre Histoire</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Rhinovate est né dans les salles de classe de l'Université de Californie, Berkeley, où cinq étudiants passionnés par la technologie et la médecine se sont réunis avec une vision commune : utiliser l'intelligence artificielle pour améliorer l'expérience des patients en chirurgie esthétique.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Tout a commencé lorsque nous avons réalisé que les patients de rhinoplastie manquaient souvent de clarté sur les résultats attendus et traversaient leur parcours chirurgical avec anxiété et incertitude. Nous avons décidé de relever ce défi en combinant notre expertise en IA, en réalité augmentée et en design d'expérience utilisateur.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Aujourd'hui, nous développons une solution révolutionnaire qui permet aux patients de visualiser leurs résultats potentiels avec une précision inégalée, tout en offrant aux chirurgiens des outils avancés pour une planification optimale.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d" 
                alt="Notre équipe à Berkeley" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Technology Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-rhinovate-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-rhinovate-800 mb-6">Notre Technologie</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Une fusion innovante d'intelligence artificielle, de réalité augmentée et de modélisation 3D pour révolutionner la rhinoplastie.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-rhinovate-100 flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rhinovate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-center mb-4">IA Avancée</h3>
                <p className="text-gray-600 text-center">
                  Nos algorithmes analysent des milliers d'images avant/après pour générer des prédictions d'une précision exceptionnelle.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-rhinovate-100 flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rhinovate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-center mb-4">Modélisation 3D Réaliste</h3>
                <p className="text-gray-600 text-center">
                  Visualisations hyper-réalistes qui montrent les résultats potentiels sous différents angles et conditions d'éclairage.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="h-16 w-16 rounded-full bg-rhinovate-100 flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rhinovate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-center mb-4">Suivi de Guérison</h3>
                <p className="text-gray-600 text-center">
                  Simulation des différentes étapes de guérison pour préparer les patients à l'évolution post-opératoire.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-20 px-6" id="team">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-rhinovate-800 mb-6">Notre Équipe</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Une équipe passionnée de Berkeley, combinant expertise en IA, médecine et design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-64 overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-rhinovate-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-rhinovate-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-rhinovate-800 mb-6">Nos Valeurs</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Les principes qui guident notre innovation et notre croissance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-rhinovate-100 flex items-center justify-center mx-auto mb-6">
                    <value.icon className="h-6 w-6 text-rhinovate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-4">{value.title}</h3>
                  <p className="text-gray-600 text-center">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-rhinovate-900 mb-6">Rejoignez la révolution de la rhinoplastie</h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-12">
            Que vous soyez patient ou chirurgien, découvrez comment Rhinovate peut transformer votre expérience.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <form 
              action="https://formsubmit.co/rhinovateinc@gmail.com" 
              method="POST" 
              className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto"
            >
              <input type="hidden" name="_subject" value="Nouveau participant au programme beta!" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="email" name="email" placeholder="Votre email" required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm" 
              />
              <Button type="submit" className="gap-2 bg-rhinovate-600 hover:bg-rhinovate-700">
                Rejoindre la bêta <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            
            <Link to="#contact">
              <Button variant="outline" className="gap-2 border-rhinovate-600 text-rhinovate-600">
                Nous contacter <Send className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default About;
