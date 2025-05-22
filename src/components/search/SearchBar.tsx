
import { useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "Search for coffee beans..." }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="search"
          className="block w-full p-3 pl-10 pr-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-brown-500 focus:border-brown-500"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="absolute inset-y-0 right-12 flex items-center pr-3"
            onClick={clearSearch}
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-0 top-0 bottom-0 px-4 bg-brown-600 rounded-r-lg text-white hover:bg-brown-700"
        >
          Search
        </button>
      </div>
    </form>
  );
}
