
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import SearchBar from "@/components/search/SearchBar";
import BeanCard from "@/components/search/BeanCard";
import { mockCoffeeBeans } from "@/data/mockData";
import { CoffeeBean } from "@/types";

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState<CoffeeBean[]>(mockCoffeeBeans);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query) {
      setSearchResults(mockCoffeeBeans);
      return;
    }
    
    // Filter beans based on search query
    const filteredBeans = mockCoffeeBeans.filter(
      (bean) =>
        bean.name.toLowerCase().includes(query.toLowerCase()) ||
        bean.roaster.toLowerCase().includes(query.toLowerCase()) ||
        bean.origin.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filteredBeans);
  };

  return (
    <Layout title="BeanRate - Search">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Find Coffee Beans</h1>
        
        <SearchBar onSearch={handleSearch} />
        
        <div className="mt-6">
          {searchQuery && (
            <p className="text-sm text-gray-500 mb-4">
              {searchResults.length} results for "{searchQuery}"
            </p>
          )}
          
          {searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((bean) => (
                <BeanCard key={bean.id} bean={bean} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No coffee beans found.</p>
              <p className="text-sm text-gray-400 mt-1">
                Try a different search term or browse our trending beans.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
