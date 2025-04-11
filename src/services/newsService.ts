
import { useQuery } from '@tanstack/react-query';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

// This function will fetch rhinoplasty news from a news API
export const fetchRhinoplastyNews = async (): Promise<NewsArticle[]> => {
  try {
    // In a real application, you would use an actual API key
    // Since we can't use backend services in this example, we'll simulate the response
    // with some mock data and add a random element for "freshness"
    
    // For demonstration purposes - in a real app this would be a fetch to a news API
    const mockArticles: NewsArticle[] = [
      {
        title: "New Study Shows Improved Patient Satisfaction with 3D Visualization Before Rhinoplasty",
        description: "A recent study published in the Journal of Plastic and Reconstructive Surgery demonstrates that patients who viewed 3D models of their potential results reported 45% higher satisfaction rates post-surgery.",
        url: "https://example.com/rhinoplasty-3d-visualization",
        urlToImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000).toISOString(),
        source: { name: "Plastic Surgery Today" }
      },
      {
        title: "AI Technology Revolutionizes Rhinoplasty Planning",
        description: "Artificial intelligence is transforming how surgeons plan and execute rhinoplasty procedures, with new tools offering unprecedented accuracy in predicting outcomes.",
        url: "https://example.com/ai-rhinoplasty-revolution",
        urlToImage: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000).toISOString(),
        source: { name: "Medical Tech Weekly" }
      },
      {
        title: "Patient Healing Timeline Predictions Improve with New Software",
        description: "New software allows surgeons to predict and visualize the entire healing process for rhinoplasty patients, reducing post-operative anxiety and increasing satisfaction.",
        url: "https://example.com/healing-timeline-software",
        urlToImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
        source: { name: "Healthcare Innovation" }
      },
      {
        title: "Leading Surgeons Adopt 3D Visualization Tools for Rhinoplasty",
        description: "Top plastic surgeons across the country are increasingly adopting 3D visualization tools to improve patient communication and surgical planning.",
        url: "https://example.com/surgeons-adopt-3d-tools",
        urlToImage: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000).toISOString(),
        source: { name: "Surgical Innovation Journal" }
      },
      {
        title: "The Future of Rhinoplasty: Personalized AI Simulations",
        description: "Experts predict that personalized AI simulations will become the standard of care in rhinoplasty consultations within the next five years.",
        url: "https://example.com/future-rhinoplasty-ai",
        urlToImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000).toISOString(),
        source: { name: "Digital Health Today" }
      },
      {
        title: "Patient Anxiety Reduced by 60% with Pre-Visualization Tools",
        description: "A new clinical trial shows that patients who use pre-visualization tools before rhinoplasty report 60% less anxiety about their results and recovery process.",
        url: "https://example.com/reduced-anxiety-visualization",
        urlToImage: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7",
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000).toISOString(),
        source: { name: "Clinical Psychiatry News" }
      }
    ];
    
    // Add some randomness to simulate "real" updates
    const randomFactor = Date.now() % 3;
    if (randomFactor === 0) {
      mockArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else if (randomFactor === 1) {
      // Simulate a new article appearing occasionally
      const newArticleTitles = [
        "Breakthrough in Rhinoplasty Recovery Time with New Techniques",
        "Patient Expectations Managed Better with 3D Imaging",
        "International Conference Highlights Advances in Rhinoplasty Technology"
      ];
      
      const randomTitle = newArticleTitles[Math.floor(Math.random() * newArticleTitles.length)];
      
      mockArticles.unshift({
        title: randomTitle,
        description: "This article was just published discussing the latest advances in rhinoplasty technology and techniques.",
        url: "https://example.com/latest-rhinoplasty-news",
        urlToImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
        publishedAt: new Date().toISOString(),
        source: { name: "Breaking Medical News" }
      });
    }
    
    return mockArticles;
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

export const useRhinoplastyNews = (refreshInterval = 60000) => {
  return useQuery({
    queryKey: ['rhinoplastyNews'],
    queryFn: fetchRhinoplastyNews,
    refetchInterval: refreshInterval, // Refetch every minute
    refetchOnWindowFocus: true,
    staleTime: refreshInterval / 2,
  });
};
