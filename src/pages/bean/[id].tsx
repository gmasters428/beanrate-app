
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import { mockCoffeeBeans, mockRatings } from "@/data/mockData";
import { CoffeeBean, Rating } from "@/types";
import { Coffee, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function BeanDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [bean, setBean] = useState<CoffeeBean | null>(null);
  const [beanRatings, setBeanRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Find the bean with the matching ID
      const foundBean = mockCoffeeBeans.find((b) => b.id === id);
      setBean(foundBean || null);
      
      // Find all ratings for this bean
      const foundRatings = mockRatings.filter((r) => r.coffeeBeanId === id);
      setBeanRatings(foundRatings);
      
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="max-w-md mx-auto text-center py-12">
          <p>Loading bean details...</p>
        </div>
      </Layout>
    );
  }

  if (!bean) {
    return (
      <Layout title="Bean Not Found">
        <div className="max-w-md mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bean Not Found</h1>
          <p className="text-gray-600 mb-6">The coffee bean you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/search")}
            className="px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700"
          >
            Search for Beans
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${bean.name} by ${bean.roaster} | BeanRate`}>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="relative h-48 w-full">
            {bean.imageUrl ? (
              <Image 
                src={bean.imageUrl} 
                alt={bean.name} 
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                <Coffee className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-900">{bean.name}</h1>
            <p className="text-lg text-gray-700">by {bean.roaster}</p>
            
            <div className="mt-3 flex items-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(bean.averageRating) ? "text-yellow-400" : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 15.585l-7.07 3.716 1.35-7.87L.36 7.13l7.91-1.15L10 0l1.73 5.98 7.91 1.15-5.92 5.77 1.35 7.87z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-gray-700">
                {bean.averageRating.toFixed(1)} ({bean.totalRatings} ratings)
              </span>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-gray-700">
                <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                <span>{bean.origin}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Coffee className="h-5 w-5 mr-2 text-gray-500" />
                <span>{bean.roastLevel} Roast</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                <span>Added {format(new Date(bean.createdAt), "MMMM d, yyyy")}</span>
              </div>
            </div>
            
            {bean.description && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{bean.description}</p>
              </div>
            )}
            
            <div className="mt-6">
              <button
                onClick={() => router.push(`/rate?beanId=${bean.id}`)}
                className="w-full py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700"
              >
                Rate This Bean
              </button>
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {beanRatings.length > 0 
            ? `Ratings (${beanRatings.length})` 
            : "No Ratings Yet"}
        </h2>
        
        <div className="space-y-4">
          {beanRatings.map((rating) => (
            <RatingCard key={rating.id} rating={rating} />
          ))}
          
          {beanRatings.length === 0 && (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">Be the first to rate this bean!</p>
              <button
                onClick={() => router.push(`/rate?beanId=${bean.id}`)}
                className="mt-4 px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700"
              >
                Add Rating
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
