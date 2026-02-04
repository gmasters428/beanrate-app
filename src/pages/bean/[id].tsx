import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { coffeeBeansService } from "@/services/coffeeBeansService";
import { ratingsService, RatingWithDetails } from "@/services/ratingsService";
import { CoffeeBean } from "@/types";
import RatingCard from "@/components/home/RatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Star, Coffee, MapPin, Edit } from "lucide-react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useToast } from "@/hooks/use-toast";
import { isAdmin } from "@/lib/adminUtils";

interface BeanDetails extends CoffeeBean {
  avg_rating: number;
  rating_count: number;
}

export default function BeanPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, user } = useAuthGuard();
  const { toast } = useToast();
  const isAdminUser = isAdmin(user?.email);
  const adminFileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [bean, setBean] = useState<BeanDetails | null>(null);
  const [ratings, setRatings] = useState<RatingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminImageFile, setAdminImageFile] = useState<File | null>(null);
  const [adminImagePreview, setAdminImagePreview] = useState<string | null>(null);
  const [adminImageSaving, setAdminImageSaving] = useState(false);

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

  useEffect(() => {
    if (!adminImageFile) {
      setAdminImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(adminImageFile);
    setAdminImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [adminImageFile]);

  const resetAdminImageInput = () => {
    setAdminImageFile(null);
    setAdminImagePreview(null);
    if (adminFileInputRef.current) {
      adminFileInputRef.current.value = "";
    }
  };

  const handleAdminImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      resetAdminImageInput();
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      resetAdminImageInput();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please choose an image under 10MB.",
        variant: "destructive",
      });
      resetAdminImageInput();
      return;
    }

    setAdminImageFile(file);
  };

  const handleAdminImageUpload = async () => {
    if (!bean || !adminImageFile) {
      toast({
        title: "Select an image",
        description: "Choose an image to upload before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdminImageSaving(true);
      const updatedBean = await coffeeBeansService.updateCoffeeBean(bean.id, {}, adminImageFile);
      setBean((prev) =>
        prev
          ? {
              ...prev,
              image_url: updatedBean.image_url ?? prev.image_url,
            }
          : prev
      );
      toast({
        title: "Image updated",
        description: "The bean image has been updated successfully.",
      });
      resetAdminImageInput();
    } catch (error) {
      console.error("Failed to update bean image:", error);
      toast({
        title: "Update failed",
        description: "Could not update the bean image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAdminImageSaving(false);
    }
  };

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
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading bean details...</p>
      </div>
    );
  }

  if (!bean) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Coffee bean not found.</p>
      </div>
    );
  }

  return (
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
          {isAdminUser && (
            <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Admin: Update Bean Image</h3>
              <p className="text-xs text-gray-600 mt-1">
                Upload a new photo to replace the current bean image.
              </p>
              <div className="mt-3 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="bean-image-upload" className="text-xs text-gray-700">
                    New image
                  </Label>
                  <Input
                    id="bean-image-upload"
                    type="file"
                    accept="image/*"
                    ref={adminFileInputRef}
                    onChange={handleAdminImageChange}
                    disabled={adminImageSaving}
                  />
                </div>
                {adminImagePreview && (
                  <div className="flex items-center gap-3">
                    <Image
                      src={adminImagePreview}
                      alt="New bean preview"
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-md border object-cover"
                      unoptimized
                    />
                    <p className="text-xs text-gray-500">Preview of the new image.</p>
                  </div>
                )}
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleAdminImageUpload}
                  disabled={!adminImageFile || adminImageSaving}
                >
                  {adminImageSaving ? "Uploading..." : "Save Image"}
                </Button>
              </div>
            </div>
          )}
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
          
          {isAuthenticated ? (
            <Link href={`/rate?beanId=${bean.id}`}>
              <Button className="w-full md:w-auto">
                <Edit className="h-4 w-4 mr-2" />
                Rate this Coffee
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" className="w-full md:w-auto">
                Sign in to Rate
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
  );
}
