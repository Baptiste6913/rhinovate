
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRhinoplastyNews, NewsArticle } from '@/services/newsService';
import { Loader2, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const News = () => {
  const { data: articles, isLoading, error, dataUpdatedAt, refetch } = useRhinoplastyNews(30000); // Refetch every 30 seconds
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();
  
  useEffect(() => {
    if (articles) {
      setFilteredArticles(articles);
      const updateTime = new Date(dataUpdatedAt);
      setLastUpdate(formatDistanceToNow(updateTime, { addSuffix: true }));
      
      if (dataUpdatedAt > 0) {
        toast({
          title: "News updated",
          description: "The latest rhinoplasty news has been loaded.",
        });
      }
    }
  }, [articles, dataUpdatedAt, toast]);
  
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    if (articles) {
      if (newFilter === 'all') {
        setFilteredArticles(articles);
      } else {
        // In a real app, you would have actual categories
        // For this example, we'll filter based on source name patterns
        const filtered = articles.filter(article => {
          if (newFilter === 'press') {
            return article.source.name.includes('Journal') || article.source.name.includes('News');
          } else {
            return !article.source.name.includes('Journal') && !article.source.name.includes('News');
          }
        });
        setFilteredArticles(filtered);
      }
    }
  };
  
  const handleOpenArticle = (url: string) => {
    // Open the article in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const handleManualRefresh = () => {
    refetch();
    toast({
      title: "Refreshing news",
      description: "Checking for the latest rhinoplasty articles...",
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Rhinoplasty News & Insights</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Stay updated with the latest advancements in rhinoplasty technology, research, and industry trends.
            </p>
            
            {/* News Filters */}
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-rhinovate-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Articles
              </button>
              <button
                onClick={() => handleFilterChange('press')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'press' 
                    ? 'bg-rhinovate-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Press Releases
              </button>
              <button
                onClick={() => handleFilterChange('blog')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'blog' 
                    ? 'bg-rhinovate-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Blog Articles
              </button>
            </div>
            
            {/* Last Updated Info */}
            <div className="mt-4 flex justify-center items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>Last updated: {lastUpdate}</span>
              <button 
                onClick={handleManualRefresh}
                className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                title="Refresh news"
              >
                <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* News Articles Grid */}
          {isLoading && !articles ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 text-rhinovate-600 animate-spin" />
              <p className="ml-4 text-lg text-gray-600">Loading the latest articles...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-lg text-red-600">Could not load articles. Please try again later.</p>
              <button 
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-rhinovate-600 text-white rounded-md"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article, index) => (
                <div 
                  key={`${article.title}-${index}`}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-video">
                    <img 
                      src={article.urlToImage || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158'}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                      <button 
                        onClick={() => handleOpenArticle(article.url)}
                        className="text-white flex items-center gap-1 text-sm font-medium hover:underline"
                      >
                        Read full article <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-rhinovate-600 text-sm mb-2">
                      {article.source.name} • {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                    </p>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 hover:text-rhinovate-600 transition-colors">
                      <button onClick={() => handleOpenArticle(article.url)} className="text-left">
                        {article.title}
                      </button>
                    </h3>
                    <p className="text-gray-600 line-clamp-3">{article.description}</p>
                    <button 
                      onClick={() => handleOpenArticle(article.url)}
                      className="mt-4 text-rhinovate-600 font-medium hover:text-rhinovate-800 transition-colors inline-flex items-center gap-1"
                    >
                      Read more <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* No Articles Message */}
          {!isLoading && filteredArticles.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg text-gray-600">No articles found for this category.</p>
              <button 
                onClick={() => handleFilterChange('all')}
                className="mt-4 px-4 py-2 bg-rhinovate-600 text-white rounded-md"
              >
                View All Articles
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default News;
