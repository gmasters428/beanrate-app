import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { coffeeBeansService } from "@/services/coffeeBeansService";
import { ratingsService } from "@/services/ratingsService";
import { Coffee, Upload, Star, X, MapPin, Calendar, DollarSign, Award, Zap, Droplets, Mountain } from "lucide-react";
import Layout from "@/components/layout/Layout";

const addBeanSchema = z.object({
  // Essential Bean Details
  name: z.string().min(1, "Bean name is required").max(100, "Name too long"),
  brand: z.string().min(1, "Brand/Roaster is required").max(100, "Brand name too long"),
  origin: z.string().optional(),
  region: z.string().optional(),
  altitude: z.string().optional(),
  processing_method: z.enum(["washed", "natural", "honey", "semi-washed", "wet-hulled", "other"]).optional(),
  roast_level: z.enum(["light", "medium-light", "medium", "medium-dark", "dark"]).optional(),
  roast_date: z.string().optional(),
  harvest_date: z.string().optional(),
  description: z.string().optional(),
  flavor_notes: z.array(z.string()).optional(),
  
  // Pricing & Availability
  price: z.number().min(0).optional(),
  price_per_unit: z.enum(["lb", "kg", "oz", "bag"]).optional(),
  purchase_url: z.string().url().optional().or(z.literal("")),
  is_available: z.boolean().default(true),
  
  // Rating Details (0.1 precision)
  overall_rating: z.number().min(1).max(5).multipleOf(0.1),
  aroma_rating: z.number().min(1).max(5).multipleOf(0.1).optional(),
  flavor_rating: z.number().min(1).max(5).multipleOf(0.1).optional(),
  aftertaste_rating: z.number().min(1).max(5).multipleOf(0.1).optional(),
  acidity_rating: z.number().min(1).max(5).multipleOf(0.1).optional(),
  body_rating: z.number().min(1).max(5).multipleOf(0.1).optional(),
  sweetness_rating: z.number().min(1).max(5).multipleOf(0.1).optional(),
  balance_rating: z.number().min(1).max(5).multipleOf(0.1).optional(),
  
  // Brewing Details
  brewing_method: z.string().optional(),
  grinder: z.string().optional(),
  grind_size: z.string().optional(),
  water_temp: z.number().min(80).max(100).optional(),
  brew_ratio: z.string().optional(),
  review_text: z.string().max(2000, "Review too long").optional(),
});

type AddBeanFormData = z.infer<typeof addBeanSchema>;

const roastLevels = [
  { value: "light", label: "Light Roast", description: "Light brown, no oil on surface" },
  { value: "medium-light", label: "Medium-Light", description: "Light brown with slight oil" },
  { value: "medium", label: "Medium Roast", description: "Medium brown, balanced flavor" },
  { value: "medium-dark", label: "Medium-Dark", description: "Rich brown with some oil" },
  { value: "dark", label: "Dark Roast", description: "Dark brown with oil on surface" },
];

const processingMethods = [
  { value: "washed", label: "Washed", description: "Clean, bright flavors" },
  { value: "natural", label: "Natural", description: "Fruity, wine-like characteristics" },
  { value: "honey", label: "Honey Process", description: "Sweet, complex flavors" },
  { value: "semi-washed", label: "Semi-Washed", description: "Balanced characteristics" },
  { value: "wet-hulled", label: "Wet-Hulled", description: "Full body, earthy notes" },
  { value: "other", label: "Other", description: "Experimental or unique processing" },
];

const brewingMethods = [
  "Espresso", "Pour Over", "French Press", "AeroPress", "Chemex", 
  "V60", "Kalita Wave", "Drip Coffee", "Cold Brew", "Moka Pot", 
  "Turkish Coffee", "Siphon", "Clever Dripper"
];

const grindSizes = [
  "Extra Coarse", "Coarse", "Medium-Coarse", "Medium", 
  "Medium-Fine", "Fine", "Extra Fine", "Powder"
];

const commonFlavorNotes = [
  "Chocolate", "Vanilla", "Caramel", "Nutty", "Fruity", "Floral", 
  "Citrus", "Berry", "Wine", "Earthy", "Spicy", "Smoky",
  "Sweet", "Tart", "Bright", "Clean", "Complex", "Balanced"
];

export default function AddBeanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [flavorNoteInput, setFlavorNoteInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const form = useForm<AddBeanFormData>({
    resolver: zodResolver(addBeanSchema),
    defaultValues: {
      overall_rating: 3.5,
      aroma_rating: 3.5,
      flavor_rating: 3.5,
      aftertaste_rating: 3.5,
      acidity_rating: 3.5,
      body_rating: 3.5,
      sweetness_rating: 3.5,
      balance_rating: 3.5,
      flavor_notes: [],
      is_available: true,
      price_per_unit: "lb",
    },
    mode: "onChange", // Enable real-time validation
  });

  // Debug form state
  const watchedValues = form.watch();
  console.log('Current form values:', watchedValues);
  
  const formErrors = form.formState.errors;
  if (Object.keys(formErrors).length > 0) {
    console.log('Form validation errors:', formErrors);
  }

  const flavorNotes = form.watch("flavor_notes") || [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setImageFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 images
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const addFlavorNote = (note?: string) => {
    const noteToAdd = note || flavorNoteInput.trim();
    if (noteToAdd && !flavorNotes.includes(noteToAdd)) {
      form.setValue("flavor_notes", [...flavorNotes, noteToAdd]);
      setFlavorNoteInput("");
    }
  };

  const removeFlavorNote = (note: string) => {
    form.setValue("flavor_notes", flavorNotes.filter(n => n !== note));
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

  const onSubmit = async (data: AddBeanFormData) => {
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Raw form data:', data);
    console.log('Button clicked - form submission initiated');
    
    // Immediate visual feedback
    toast({
      title: "🔄 Form Submitted",
      description: "Processing your coffee bean submission...",
    });
    
    if (!user) {
      console.log('❌ No user found');
      toast({
        title: "Authentication Required",
        description: "Please log in to add a coffee bean.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ User authenticated:', user.id);
    
    // Set loading state immediately
    setIsSubmitting(true);
    console.log('✅ Setting isSubmitting to true');
    
    try {
      // Force validation trigger and get fresh form state
      const isValidForm = await form.trigger();
      const formState = form.formState;
      const currentErrors = form.formState.errors;
      
      console.log('Form validation details:', {
        isValidForm,
        formStateIsValid: formState.isValid,
        errors: currentErrors,
        errorCount: Object.keys(currentErrors).length,
        isSubmitting: formState.isSubmitting,
      });
      
      // Show specific validation errors
      if (!isValidForm || Object.keys(currentErrors).length > 0) {
        console.log('❌ Form validation failed:', currentErrors);
        
        // Find the first error to show user
        const firstErrorField = Object.keys(currentErrors)[0];
        const firstError = currentErrors[firstErrorField as keyof typeof currentErrors];
        
        toast({
          title: "❌ Form Validation Error",
          description: firstError?.message || "Please check all required fields and fix any errors before submitting.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Show immediate feedback that validation passed
      toast({
        title: "✅ Validation Passed",
        description: "Creating coffee bean and rating...",
      });

      console.log("📝 Creating coffee bean with data:", data);
      
      // Create the coffee bean with all fields
      const beanData = {
        name: data.name,
        brand: data.brand,
        origin: data.origin || null,
        region: data.region || null,
        altitude: data.altitude || null,
        processing_method: data.processing_method || null,
        roast_level: data.roast_level || null,
        roast_date: data.roast_date || null,
        harvest_date: data.harvest_date || null,
        description: data.description || null,
        flavor_notes: data.flavor_notes || [],
        price: data.price || null,
        price_per_unit: data.price_per_unit || null,
        purchase_url: data.purchase_url || null,
        is_available: data.is_available ?? true,
      };

      console.log("☕ Bean data being sent to service:", beanData);
      
      let newBean;
      try {
        newBean = await coffeeBeansService.createCoffeeBean(beanData, imageFiles[0]);
        console.log("✅ Coffee bean created successfully:", newBean);
        
        toast({
          title: "☕ Bean Created",
          description: `Coffee bean "${data.name}" created successfully!`,
        });
      } catch (beanError) {
        console.error("❌ Bean creation failed:", beanError);
        throw new Error(`Failed to create coffee bean: ${beanError}`);
      }

      // Create the rating with better error handling
      const ratingData = {
        user_id: user.id,
        coffee_bean_id: newBean.id,
        overall_rating: data.overall_rating,
        aroma_rating: data.aroma_rating || null,
        flavor_rating: data.flavor_rating || null,
        aftertaste_rating: data.aftertaste_rating || null,
        acidity_rating: data.acidity_rating || null,
        body_rating: data.body_rating || null,
        sweetness_rating: data.sweetness_rating || null,
        balance_rating: data.balance_rating || null,
        brewing_method: data.brewing_method || null,
        grinder: data.grinder || null,
        grind_size: data.grind_size || null,
        water_temp: data.water_temp || null,
        brew_ratio: data.brew_ratio || null,
        review_text: data.review_text || null,
      };

      console.log("⭐ Rating data being sent to service:", ratingData);
      
      let rating;
      try {
        rating = await ratingsService.createRating(ratingData);
        console.log("✅ Rating created successfully:", rating);
        
        toast({
          title: "⭐ Rating Added",
          description: "Your rating has been saved successfully!",
        });
      } catch (ratingError) {
        console.error("❌ Rating creation failed:", ratingError);
        // Show warning but don't fail the entire process
        toast({
          title: "⚠️ Partial Success",
          description: "Coffee bean added successfully, but there was an issue with the rating. You can add a rating later.",
          variant: "destructive",
        });
      }

      // Show success feedback with better UX
      toast({
        title: "🎉 Success!",
        description: `"${data.name}" by ${data.brand} has been added to your collection!`,
      });

      console.log("🔄 Redirectinging to bean page:", `/bean/${newBean.id}`);
      
      // Add a small delay to let the user see the success message
      setTimeout(() => {
        router.push(`/bean/${newBean.id}`);
      }, 1000);
      
    } catch (error) {
      console.error("❌ Critical error during submission:", error);
      
      // More detailed error handling
      let errorMessage = "Failed to add coffee bean. Please try again.";
      if (error instanceof Error) {
        console.log("Error name:", error.name);
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);
        errorMessage = `Failed to add coffee bean: ${error.message}`;
        
        // Check for specific error types
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          errorMessage = "A coffee bean with this name and brand already exists. Please use a different name or check existing beans.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('validation')) {
          errorMessage = "Form validation error. Please check all fields and try again.";
        }
      }
      
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('✅ Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  // TEST SUBMISSION FUNCTION
  const testSubmit = async () => {
    console.log('🧪 TEST SUBMISSION STARTED');
    toast({
      title: "🧪 Test Submission",
      description: "Testing direct service calls...",
    });
    
    setIsSubmitting(true);
    
    try {
      // Test with minimal data
      const testBeanData = {
        name: "Test Coffee Bean " + Date.now(),
        brand: "Test Roaster",
        origin: "Test Origin",
        flavor_notes: ["Test Note"],
      };
      
      console.log('🧪 Creating test bean:', testBeanData);
      const testBean = await coffeeBeansService.createCoffeeBean(testBeanData, null);
      console.log('✅ Test bean created:', testBean);
      
      // Test rating creation
      const testRatingData = {
        user_id: user!.id,
        coffee_bean_id: testBean.id,
        overall_rating: 4.5,
      };
      
      console.log('🧪 Creating test rating:', testRatingData);
      const testRating = await ratingsService.createRating(testRatingData);
      console.log('✅ Test rating created:', testRating);
      
      toast({
        title: "✅ Test Success!",
        description: "Services are working correctly!",
      });
      
      // Navigate to the test bean
      router.push(`/bean/${testBean.id}`);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      toast({
        title: "❌ Test Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const EnhancedRatingSlider = ({ 
    name, 
    label, 
    icon: Icon,
    description 
  }: { 
    name: keyof AddBeanFormData; 
    label: string;
    icon?: any;
    description?: string;
  }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 text-amber-600" />}
              <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
              {renderStars(typeof field.value === "number" ? field.value : 3.5)}
            </div>
          </FormLabel>
          <FormControl>
            <Slider
              min={1}
              max={5}
              step={0.1}
              value={[typeof field.value === "number" ? field.value : 3.5]}
              onValueChange={(value) => field.onChange(value[0])}
              className="w-full"
            />
          </FormControl>
          {description && (
            <FormDescription className="text-xs text-muted-foreground">
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Coffee className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Please log in to add a coffee bean and share your tasting experience.
              </p>
              <Button onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Header */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-amber-400 rounded-lg blur opacity-25"></div>
            <h1 className="relative text-4xl font-bold flex items-center gap-3 mb-2 bg-white px-4 py-2 rounded-lg">
              <Coffee className="h-10 w-10 text-amber-600" />
              Add a New Coffee Bean
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share a new coffee bean with the community and add your detailed tasting notes.
            Help fellow coffee enthusiasts discover their next favorite brew.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Essential Bean Information */}
            <Card className="bg-gradient-to-br from-white to-amber-50/30 border-amber-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Coffee className="h-5 w-5" />
                  Essential Bean Information
                </CardTitle>
                <CardDescription>
                  The basic details that identify this coffee bean
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Bean Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Ethiopian Yirgacheffe G1" 
                            className="bg-white/80 border-amber-200/50 focus:border-amber-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Brand/Roaster *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Blue Bottle Coffee" 
                            className="bg-white/80 border-amber-200/50 focus:border-amber-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-sm font-medium">
                          <MapPin className="h-3 w-3" />
                          Origin Country
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Ethiopia" 
                            className="bg-white/80 border-amber-200/50 focus:border-amber-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Region/Farm</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Yirgacheffe, Kochere" 
                            className="bg-white/80 border-amber-200/50 focus:border-amber-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="altitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-sm font-medium">
                          <Mountain className="h-3 w-3" />
                          Altitude
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 1,800-2,200m" 
                            className="bg-white/80 border-amber-200/50 focus:border-amber-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="processing_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-sm font-medium">
                          <Droplets className="h-3 w-3" />
                          Processing Method
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/80 border-amber-200/50">
                              <SelectValue placeholder="Select processing method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {processingMethods.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                <div>
                                  <div className="font-medium">{method.label}</div>
                                  <div className="text-xs text-muted-foreground">{method.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="roast_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Roast Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/80 border-amber-200/50">
                              <SelectValue placeholder="Select roast level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roastLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                <div>
                                  <div className="font-medium">{level.label}</div>
                                  <div className="text-xs text-muted-foreground">{level.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roast_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-sm font-medium">
                          <Calendar className="h-3 w-3" />
                          Roast Date
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className="bg-white/80 border-amber-200/50 focus:border-amber-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="harvest_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Harvest Season</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., November 2023" 
                            className="bg-white/80 border-amber-200/50 focus:border-amber-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this coffee bean - its story, unique characteristics, what makes it special..."
                          className="min-h-[120px] bg-white/80 border-amber-200/50 focus:border-amber-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Enhanced Flavor Notes Section */}
                <div className="space-y-4">
                  <FormLabel className="text-sm font-medium">Flavor Notes & Characteristics</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {commonFlavorNotes.map((note) => (
                      <Button
                        key={note}
                        type="button"
                        variant={flavorNotes.includes(note) ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => addFlavorNote(note)}
                      >
                        {note}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a custom flavor note..."
                      value={flavorNoteInput}
                      onChange={(e) => setFlavorNoteInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFlavorNote())}
                      className="bg-white/80 border-amber-200/50 focus:border-amber-400"
                    />
                    <Button 
                      type="button" 
                      onClick={() => addFlavorNote()} 
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      Add Note
                    </Button>
                  </div>
                  {flavorNotes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {flavorNotes.map((note) => (
                        <Badge 
                          key={note} 
                          variant="secondary" 
                          className="flex items-center gap-1 bg-amber-100 text-amber-800 hover:bg-amber-200"
                        >
                          {note}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-amber-600"
                            onClick={() => removeFlavorNote(note)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Image Upload */}
            <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Upload className="h-5 w-5" />
                  Bean Photos
                </CardTitle>
                <CardDescription>
                  Upload up to 5 images of the coffee bean, packaging, or brewing setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-blue-200 hover:border-blue-300'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                  <p className="text-lg font-medium mb-2">Drop images here or click to upload</p>
                  <p className="text-sm text-muted-foreground mb-4">PNG, JPG up to 10MB each</p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button type="button" variant="outline" asChild>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      Choose Files
                    </label>
                  </Button>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={preview}
                          alt={`Bean preview ${index + 1}`}
                          width={120}
                          height={120}
                          className="object-cover rounded-lg border shadow-sm w-full h-24"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Rating Section */}
            <Card className="bg-gradient-to-br from-white to-amber-50/30 border-amber-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Star className="h-5 w-5" />
                  Your Detailed Rating & Review
                </CardTitle>
                <CardDescription>
                  Rate this coffee on multiple characteristics with precision to 0.1 points (e.g., 4.6)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Overall Rating - Featured */}
                <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-6 rounded-xl border border-amber-200">
                  <EnhancedRatingSlider 
                    name="overall_rating" 
                    label="Overall Rating" 
                    icon={Award}
                    description="Your comprehensive rating of this coffee bean"
                  />
                </div>
                
                <Separator className="my-6" />
                
                {/* Detailed Characteristics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <EnhancedRatingSlider 
                    name="aroma_rating" 
                    label="Aroma" 
                    description="The fragrance and smell intensity"
                  />
                  <EnhancedRatingSlider 
                    name="flavor_rating" 
                    label="Flavor" 
                    description="The taste experience on your palate"
                  />
                  <EnhancedRatingSlider 
                    name="aftertaste_rating" 
                    label="Aftertaste" 
                    description="The lingering taste after swallowing"
                  />
                  <EnhancedRatingSlider 
                    name="acidity_rating" 
                    label="Acidity" 
                    description="The bright, tangy quality"
                  />
                  <EnhancedRatingSlider 
                    name="body_rating" 
                    label="Body" 
                    description="The weight and mouthfeel"
                  />
                  <EnhancedRatingSlider 
                    name="sweetness_rating" 
                    label="Sweetness" 
                    description="The natural sugar presence"
                  />
                  <EnhancedRatingSlider 
                    name="balance_rating" 
                    label="Balance" 
                    description="How well all elements work together"
                  />
                </div>

                <Separator className="my-6" />

                {/* Brewing Details */}
                <div className="bg-neutral-50 p-6 rounded-xl">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    Brewing Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="brewing_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {brewingMethods.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grinder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Grinder</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Baratza Encore" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grind_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Grind Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {grindSizes.map((size) => (
                                <SelectItem key={size} value={size}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="water_temp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Water Temp (°C)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 92" 
                              min="80" 
                              max="100"
                              {...field}
                              onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="brew_ratio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Brew Ratio</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 1:16 (coffee:water)" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            The ratio of coffee to water used in brewing
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Detailed Review */}
                <FormField
                  control={form.control}
                  name="review_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Tasting Notes & Detailed Review</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your detailed tasting experience, what stood out, how it compared to other coffees, brewing tips, and any other insights that would help fellow coffee enthusiasts..."
                          className="min-h-[160px] bg-white/80 border-amber-200/50 focus:border-amber-400"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your detailed review helps other coffee lovers understand what makes this bean unique.
                        Be specific about flavors, textures, and your overall experience.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing & Availability */}
            <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <DollarSign className="h-5 w-5" />
                  Pricing & Availability (Optional)
                </CardTitle>
                <CardDescription>
                  Help others know where to find this coffee and what to expect to pay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 18.50" 
                            {...field}
                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_per_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lb">per lb</SelectItem>
                            <SelectItem value="kg">per kg</SelectItem>
                            <SelectItem value="oz">per oz</SelectItem>
                            <SelectItem value="bag">per bag</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_available"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Currently Available</FormLabel>
                          <FormDescription className="text-xs">
                            Is this coffee currently available for purchase?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="purchase_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Purchase URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="https://example.com/coffee-bean" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Link to where others can buy this coffee bean
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              {/* TEST BUTTON - Remove after debugging */}
              <Button
                type="button"
                variant="secondary"
                onClick={testSubmit}
                disabled={isSubmitting}
                className="px-4"
              >
                🧪 Test Submit
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="px-8"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Bean...
                  </>
                ) : (
                  "Add Coffee Bean ☕"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
