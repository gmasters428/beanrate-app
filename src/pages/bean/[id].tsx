
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { coffeeBeansService } from "@/services/coffeeBeansService";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { CoffeeBean, User } from "@/types";
import Layout from "@/components/layout/Layout";
import RatingCard from "@/components/home/RatingCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, Coffee, MapPin, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface BeanDetails extends CoffeeBean {
  avg_rating: number;
  rating_count: number;
}

export default function BeanPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [bean, setBean] = useState<BeanDetails | null>(null);
  const [ratings, setRatings] = useState<RatingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBeanData = async () => {
      if (typeof id !== "string") return;
      try {
        setLoading(true);
        const [beanData, ratingsData] = await Promise.all([
          coffeeBeansService.getCoffeeBeanById(id),
          ratingsService.getRatingsByBean(id),
        ]);

        if (beanData) {
          const ratingCount = ratingsData.length;
          const avgRating =
            ratingCount > 0
              ? ratingsData.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / ratingCount
              : 0;

          setBean({
            ...beanData,
            avg_rating: avgRating,
            rating_count: ratingCount,
          });
          setRatings(ratingsData);
        }
      } catch (error) {
        console.error("Failed to fetch bean data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBeanData();
  }, [id]);

  const renderStars = (ratingValue: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= Math.round(ratingValue)
                ? "text-amber-400 fill-amber-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Loading bean details...</p>
        </div>
      </Layout>
    );
  }

  if (!bean) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Coffee bean not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${bean.name} by ${bean.brand}`}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Bean Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="md:w-1/3">
            <div className="aspect-square relative rounded-xl shadow-lg overflow-hidden border">
              {bean.image_url ? (
                <Image
                  src={bean.image_url}
                  alt={bean.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Coffee className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>
          <div className="md:w-2/3">
            <h1 className="text-3xl font-bold text-gray-900">{bean.name}</h1>
            <p className="text-xl text-gray-600 mb-4">by {bean.brand}</p>
            
            <div className="flex items-center gap-4 mb-4">
              {renderStars(bean.avg_rating)}
              <span className="text-gray-600">
                {bean.avg_rating.toFixed(1)} average rating ({bean.rating_count} reviews)
              </span>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-700 mb-6">
              {bean.origin && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-500" />{bean.origin}</p>}
              {bean.roast_level && <p className="flex items-center gap-2"><Coffee className="h-4 w-4 text-gray-500" />{bean.roast_level} Roast</p>}
            </div>
            
            {bean.description && <p className="text-gray-700 mb-6">{bean.description}</p>}

            {bean.flavor_notes && bean.flavor_notes.length > 0 && (
              <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Flavor Notes</h3>
                  <div className="flex flex-wrap gap-2">
                    {bean.flavor_notes.map(note => (
                      <span key={note} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                        {note}
                      </span>
                    ))}
                  </div>
              </div>
            )}
            
            {user && (
              <Link href={`/rate?beanId=${bean.id}`}>
                <Button className="w-full md:w-auto">
                  <Edit className="h-4 w-4 mr-2" />
                  Rate this Coffee
                </Button>
              </Link>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Ratings Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Community Ratings</h2>
          {ratings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {ratings.map(rating => (
                <RatingCard key={rating.id} rating={rating} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No ratings for this coffee bean yet.</p>
              <p className="text-sm text-gray-500 mt-2">Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
