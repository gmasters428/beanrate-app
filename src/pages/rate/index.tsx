import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { coffeeBeansService, CoffeeBeanWithRatings } from "@/services/coffeeBeansService";
import { ratingsService } from "@/services/ratingsService";
import { Search, Coffee, X, Star, Award, Zap, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Head from "next/head";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { GetServerSidePropsContext } from "next";
import type { NextApiRequest, NextApiResponse } from 'next';

const brewingMethods = [
  "Espresso", "Pour Over", "French Press", "AeroPress", "Chemex", 
  "V60", "Kalita Wave", "Drip Coffee", "Cold Brew", "Moka Pot", 
  "Turkish Coffee", "Siphon", "Clever Dripper"
];

const grindSizes = [
  "Extra Coarse", "Coarse", "Medium-Coarse", "Medium", 
  "Medium-Fine", "Fine", "Extra Fine", "Powder"
];

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = getServerSupabase({ 
    req: context.req as unknown as NextApiRequest, 
    res: context.res as unknown as NextApiResponse 
  });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
}

export default function RatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { beanId } = router.query;
  
  const [selectedBean, setSelectedBean] = useState<CoffeeBeanWithRatings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CoffeeBeanWithRatings[]>([]);
  const [popularBeans, setPopularBeans] = useState<CoffeeBeanWithRatings[]>([]);
  const [showSearch, setShowSearch] = useState(!beanId);
  const [isSearching, setIsSearching] = useState(false);
  
  // Rating system with decimal precision
  const [overallRating, setOverallRating] = useState<number>(3.5);
  const [aromaRating, setAromaRating] = useState<number>(3.5);
  const [flavorRating, setFlavorRating] = useState<number>(3.5);
  const [aftertasteRating, setAftertasteRating] = useState<number>(3.5);
  const [acidityRating, setAcidityRating] = useState<number>(3.5);
  const [bodyRating, setBodyRating] = useState<number>(3.5);
  const [sweetnessRating, setSweetnessRating] = useState<number>(3.5);
  const [balanceRating, setBalanceRating] = useState<number>(3.5);
  
  // Brewing details
  const [brewMethod, setBrewMethod] = useState<string>("");
  const [grinder, setGrinder] = useState<string>("");
  const [grindSize, setGrindSize] = useState<string>("");
  const [waterTemp, setWaterTemp] = useState<number | undefined>(undefined);
  const [brewRatio, setBrewRatio] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPopularBeans();
  }, []);

  useEffect(() => {
    if (beanId && typeof beanId === "string") {
      loadBeanById(beanId);
    }
  }, [beanId]);

  const loadPopularBeans = async () => {
    try {
      const beans = await coffeeBeansService.getCoffeeBeansWithRatings(6);
      setPopularBeans(beans);
    } catch (error) {
      console.error("Error loading popular beans:", error);
    }
  };

  const loadBeanById = async (id: string) => {
    try {
      const bean = await coffeeBeansService.getCoffeeBeanById(id);
      if (bean) {
        setSelectedBean(bean);
        setShowSearch(false);
      }
    } catch (error) {
      console.error("Error loading bean:", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await coffeeBeansService.searchCoffeeBeans(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching beans:", error);
      toast({
        title: "Search Error",
        description: "Failed to search coffee beans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBean = (bean: CoffeeBeanWithRatings) => {
    setSelectedBean(bean);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars 
                ? 'fill-amber-400 text-amber-400' 
                : i === fullStars && hasHalfStar 
                  ? 'fill-amber-400/50 text-amber-400' 
                  : 'text-neutral-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-amber-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const RatingSlider = ({ 
    label, 
    value,
    onChange,
    icon: Icon,
    description 
  }: { 
    label: string;
    value: number;
    onChange: (value: number) => void;
    icon?: any;
    description?: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-amber-600" />}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {renderStars(value)}
        </div>
      </div>
      <Slider
        min={1}
        max={5}
        step={0.1}
        value={[value]}
        onValueChange={(newValue) => onChange(newValue[0])}
        className="w-full"
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );

  const handleSubmitRating = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a rating.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBean) {
      toast({
        title: "Missing Information",
        description: "Please select a coffee bean to rate.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const ratingData = {
        user_id: user.id,
        coffee_bean_id: selectedBean.id,
        overall_rating: Math.round(overallRating * 10) / 10,
        aroma_rating: Math.round(aromaRating * 10) / 10,
        flavor_rating: Math.round(flavorRating * 10) / 10,
        aftertaste_rating: Math.round(aftertasteRating * 10) / 10,
        acidity_rating: Math.round(acidityRating * 10) / 10,
        body_rating: Math.round(bodyRating * 10) / 10,
        sweetness_rating: Math.round(sweetnessRating * 10) / 10,
        balance_rating: Math.round(balanceRating * 10) / 10,
        brewing_method: brewMethod || undefined,
        grinder: grinder || undefined,
        grind_size: grindSize || undefined,
        water_temp: waterTemp,
        brew_ratio: brewRatio || undefined,
        review_text: notes || undefined,
      };
      
      const result = await ratingsService.createRating(ratingData);

      toast({
        title: "Rating Submitted! ☕",
        description: "Redirecting to your rating...",
      });

      if (result?.id) {
        await router.push(`/rating/${result.id}`);
      } else {
        await router.push("/profile");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Error",
        description: `Failed to submit rating: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>BeanRate - Rate a Coffee Bean</title>
      </Head>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-amber-400 rounded-lg blur opacity-25"></div>
            <h1 className="relative text-3xl font-bold flex items-center gap-3 mb-2 bg-white px-6 py-3 rounded-lg">
              <Star className="h-8 w-8 text-amber-600" />
              Rate a Coffee Bean
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share your detailed tasting experience with precision ratings.
          </p>
        </div>

        {showSearch ? (
          <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Search className="h-5 w-5" />
                Find a Coffee Bean
              </CardTitle>
              <CardDescription>
                Search for an existing coffee bean or add a new one to rate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    className="pl-10 bg-white/80 border-blue-200/50 focus:border-blue-400"
                    placeholder="Search for a coffee bean..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {isSearching ? "..." : "Search"}
                  </Button>
                </div>
              </form>
              
              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {searchResults.map((bean) => (
                    <div
                      key={bean.id}
                      className="flex items-center p-4 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-all duration-200 border border-blue-100 hover:border-blue-300 hover:shadow-md"
                      onClick={() => handleSelectBean(bean)}
                    >
                      <div className="h-12 w-12 relative rounded-lg overflow-hidden shadow-sm">
                        {bean.image_url ? (
                          <Image 
                            src={bean.image_url} 
                            alt={bean.name} 
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-blue-100 flex items-center justify-center">
                            <Coffee className="h-6 w-6 text-blue-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-semibold text-gray-900">{bean.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>by {bean.brand}</span>
                          {bean.origin && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{bean.origin}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {bean.averageRating && bean.averageRating > 0 && (
                          <div className="flex items-center mt-2">
                            <Star className="h-4 w-4 text-amber-400 fill-current" />
                            <span className="text-sm text-muted-foreground ml-1">
                              {bean.averageRating.toFixed(1)} ({bean.totalRatings} ratings)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8">
                  <Coffee className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No coffee beans found matching "{searchQuery}"</p>
                  <Button asChild>
                    <Link href="/bean/add">
                      + Add a new coffee bean
                    </Link>
                  </Button>
                </div>
              )}
              
              {popularBeans.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-4">Popular Beans to Rate</h3>
                    <div className="space-y-3">
                      {popularBeans.slice(0, 4).map((bean) => (
                        <div
                          key={bean.id}
                          className="flex items-center p-3 hover:bg-blue-50/50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => handleSelectBean(bean)}
                        >
                          <div className="h-10 w-10 relative rounded overflow-hidden">
                            {bean.image_url ? (
                              <Image 
                                src={bean.image_url} 
                                alt={bean.name} 
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-blue-100 flex items-center justify-center">
                                <Coffee className="h-5 w-5 text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="font-medium text-gray-900">{bean.name}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">by {bean.brand}</p>
                              {bean.averageRating && bean.averageRating > 0 && (
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-amber-400 fill-current" />
                                  <span className="text-xs text-muted-foreground ml-1">
                                    {bean.averageRating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Selected Bean */}
            {selectedBean && (
              <Card className="bg-gradient-to-br from-white to-amber-50/30 border-amber-200/50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="h-16 w-16 relative rounded-xl overflow-hidden shadow-md">
                        {selectedBean.image_url ? (
                          <Image 
                            src={selectedBean.image_url} 
                            alt={selectedBean.name} 
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-amber-100 flex items-center justify-center">
                            <Coffee className="h-8 w-8 text-amber-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h2 className="text-xl font-bold text-amber-900">{selectedBean.name}</h2>
                        <div className="flex items-center gap-2 text-amber-700">
                          <span>by {selectedBean.brand}</span>
                          {selectedBean.origin && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{selectedBean.origin}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {selectedBean.averageRating && selectedBean.averageRating > 0 && (
                          <div className="flex items-center mt-2">
                            <Star className="h-4 w-4 text-amber-400 fill-current" />
                            <span className="text-sm text-amber-600 ml-1">
                              {selectedBean.averageRating.toFixed(1)} ({selectedBean.totalRatings} ratings)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedBean(null);
                        setShowSearch(true);
                      }}
                      className="hover:bg-amber-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rating Form */}
            <Card className="bg-gradient-to-br from-white to-amber-50/30 border-amber-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Award className="h-5 w-5" />
                  Your Detailed Rating
                </CardTitle>
                <CardDescription>
                  Rate this coffee with precision to share your tasting experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Overall Rating */}
                <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-6 rounded-xl border border-amber-200">
                  <RatingSlider 
                    label="Overall Rating" 
                    value={overallRating}
                    onChange={setOverallRating}
                    icon={Award}
                    description="Your comprehensive rating of this coffee bean"
                  />
                </div>
                
                <Separator />
                
                {/* Detailed Characteristics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <RatingSlider 
                    label="Aroma" 
                    value={aromaRating}
                    onChange={setAromaRating}
                    description="The fragrance and smell intensity"
                  />
                  <RatingSlider 
                    label="Flavor" 
                    value={flavorRating}
                    onChange={setFlavorRating}
                    description="The taste experience on your palate"
                  />
                  <RatingSlider 
                    label="Aftertaste" 
                    value={aftertasteRating}
                    onChange={setAftertasteRating}
                    description="The lingering taste after swallowing"
                  />
                  <RatingSlider 
                    label="Acidity" 
                    value={acidityRating}
                    onChange={setAcidityRating}
                    description="The bright, tangy quality"
                  />
                  <RatingSlider 
                    label="Body" 
                    value={bodyRating}
                    onChange={setBodyRating}
                    description="The weight and mouthfeel"
                  />
                  <RatingSlider 
                    label="Sweetness" 
                    value={sweetnessRating}
                    onChange={setSweetnessRating}
                    description="The natural sugar presence"
                  />
                  <div className="md:col-span-2">
                    <RatingSlider 
                      label="Balance" 
                      value={balanceRating}
                      onChange={setBalanceRating}
                      description="How well all elements work together"
                    />
                  </div>
                </div>

                <Separator />

                {/* Brewing Details */}
                <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    Brewing Details (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Method</label>
                      <Select onValueChange={setBrewMethod} value={brewMethod}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {brewingMethods.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Grinder</label>
                      <Input 
                        placeholder="e.g., Baratza Encore"
                        className="bg-white" 
                        value={grinder}
                        onChange={(e) => setGrinder(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Grind Size</label>
                      <Select onValueChange={setGrindSize} value={grindSize}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {grindSizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Water Temp (°C)</label>
                      <Input 
                        type="number"
                        className="bg-white" 
                        placeholder="e.g., 92" 
                        min="80" 
                        max="100"
                        value={waterTemp || ""}
                        onChange={e => setWaterTemp(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-medium mb-2 block">Brew Ratio</label>
                    <Input 
                      placeholder="e.g., 1:16 (coffee:water)"
                      className="max-w-xs bg-white" 
                      value={brewRatio}
                      onChange={(e) => setBrewRatio(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The ratio of coffee to water used in brewing
                    </p>
                  </div>
                </div>

                {/* Review */}
                <div>
                  <label className="text-base font-semibold mb-3 block">Tasting Notes & Review</label>
                  <Textarea
                    placeholder="Share your detailed tasting experience, what stood out, how it compared to other coffees, brewing tips, and any other insights..."
                    className="min-h-[120px] bg-white/80 border-amber-200/50 focus:border-amber-400"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Your detailed review helps other coffee lovers understand this bean better.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBean(null);
                  setShowSearch(true);
                }}
                disabled={isSubmitting}
                className="px-8"
              >
                Change Bean
              </Button>
              <Button 
                onClick={handleSubmitRating}
                disabled={!selectedBean || isSubmitting}
                className="px-8 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Rating ☕"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
