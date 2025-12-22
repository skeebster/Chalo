// src/app/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import EnhancedDestinationResult from '@/components/EnhancedDestinationResult';
import { processImprovedDestinationData } from '@/lib/improvedDataProcessor';
import { SearchResult } from '@/types/search';

export default function Home() {
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!destination.trim()) {
      setError('Please enter a destination name');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const data = await processImprovedDestinationData(destination);
      setResult(data);
    } catch (err) {
      console.error('Error processing destination data:', err);
      setError('An error occurred while fetching destination information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-gray-50">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Weekend Planner</h1>
          <p className="text-xl text-gray-600">
            Discover detailed information about destinations within 3 hours of Somerset, NJ
          </p>
        </div>

        <Card className="w-full shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                placeholder="Enter destination name (e.g., Cape May, NJ)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="flex-grow text-lg py-6"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white py-6 px-8 text-lg"
              >
                {isLoading ? 'Searching...' : 'Plan My Weekend'}
              </Button>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </CardContent>
        </Card>

        {isLoading && (
          <div className="w-full flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-xl text-gray-600">Gathering verified information...</p>
          </div>
        )}

        {result && !isLoading && (
          <EnhancedDestinationResult result={result} />
        )}

        {!result && !isLoading && (
          <div className="w-full max-w-6xl mx-auto mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Plan Your Perfect Weekend</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="text-blue-600 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Verified Information</h3>
                  <p className="text-gray-600">
                    Get accurate, fact-checked information about destinations including attractions, costs, best times to visit, and insider tips from multiple verified sources.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="text-blue-600 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Local Insights</h3>
                  <p className="text-gray-600">
                    Discover destination-specific tips and recommendations from Reddit and TripAdvisor users who have visited these locations.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="text-blue-600 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Plan Efficiently</h3>
                  <p className="text-gray-600">
                    Save time with accurate travel estimates from Somerset, NJ, EV parking information, and practical logistics for your weekend trips.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-600 italic">
                "Enter a destination above to get started with your weekend planning!"
              </p>
            </div>
          </div>
        )}
      </div>
      
      <footer className="w-full max-w-6xl mx-auto mt-16 pt-8 border-t border-gray-200 text-center text-gray-500">
        <p>Weekend Planner Tool - Created to help you make the most of your weekends</p>
        <p className="mt-2">Data sourced from multiple verified platforms including Reddit, TripAdvisor, and other travel resources</p>
      </footer>
    </main>
  );
}
