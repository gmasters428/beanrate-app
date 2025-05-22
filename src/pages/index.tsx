
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import { mockRatings } from "@/data/mockData";
import { Rating } from "@/types";

export default function HomePage() {
  const [ratings, setRatings] = useState<Rating[]>(mockRatings);
  const [activeTab, setActiveTab] = useState<"following" | "trending">("following");

  const handleTabChange = (tab: "following" | "trending") => {
    setActiveTab(tab);
    // In a real app, we would fetch different data based on the tab
    // For now, we'll just use the same mock data
  };

  return (
    <Layout title="BeanRate - Home">
      <div className="max-w-md mx-auto">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === "following"
                ? "text-brown-600 border-b-2 border-brown-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("following")}
          >
            Following
          </button>
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === "trending"
                ? "text-brown-600 border-b-2 border-brown-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("trending")}
          >
            Trending
          </button>
        </div>

        <div className="space-y-4">
          {ratings.map((rating) => (
            <RatingCard key={rating.id} rating={rating} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
