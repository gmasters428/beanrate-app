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
import { supabase } from "@/integrations/supabase/client";

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
  const [submitAttempts, setSubmitAttempts] = useState(0);
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
    mode: "onChange",
  });

  const flavorNotes = form.watch("flavor_notes") || [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setImageFiles(prev => [...prev, ...validFiles].slice(0, 5));
    
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

  // TEST SUBMISSION FUNCTION for isolated testing
  const testSubmit = async () => {
    console.log('🧪 TEST SUBMISSION STARTED - Direct Service Test');
    
    setSubmitAttempts(prev => prev + 1);
    setIsSubmitting(true);
    
    try {
      toast({
        title: "🧪 Testing Services",
        description: "Creating test coffee bean and rating...",
      });

      if (!user) {
        throw new Error("User not authenticated");
      }

      // SIMPLIFIED TEST DATA - minimal required fields only
      const testBeanData = {
        name: "Service Test Bean " + Date.now(),
        brand: "Service Test Roaster",
        origin: "Test Origin",
        description: "Testing service layer functionality"
      };
      
      console.log('🧪 Step 1: Testing bean creation with minimal data:', testBeanData);
      
      // Test 1: Direct Supabase client test
      console.log('🧪 Step 1a: Testing direct Supabase client connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('coffee_beans')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        console.error('❌ Supabase connection failed:', connectionError);
        throw new Error(`Connection test failed: ${connectionError.message}`);
      }
      
      console.log('✅ Supabase connection test passed');
      
      // Test 2: Bean creation via service
      console.log('🧪 Step 2: Testing coffeeBeansService.createCoffeeBean...');
      const testBean = await coffeeBeansService.createCoffeeBean(testBeanData, null);
      console.log('✅ Service bean creation successful:', testBean);
      
      // Test 3: Rating creation via service
      console.log('🧪 Step 3: Testing ratingsService.createRating...');
      const testRatingData = {
        user_id: user.id,
        coffee_bean_id: testBean.id,
        overall_rating: 4.2,
        review_text: "Service test rating - verifying end-to-end functionality"
      };
      
      console.log('🧪 Step 3a: Rating data prepared:', testRatingData);
      const testRating = await ratingsService.createRating(testRatingData);
      console.log('✅ Service rating creation successful:', testRating);
      
      // Test 4: Verification - can we retrieve what we just created?
      console.log('🧪 Step 4: Verifying data retrieval...');
      const retrievedBean = await coffeeBeansService.getCoffeeBeanById(testBean.id);
      const retrievedRating = await ratingsService.getRatingById(testRating.id);
      
      console.log('✅ Bean retrieval successful:', retrievedBean);
      console.log('✅ Rating retrieval successful:', retrievedRating);
      
      toast({
        title: "🎉 All Tests Passed!",
        description: `Successfully created and verified: "${testBean.name}" by ${testBean.brand}`,
      });

      console.log('🧪 SERVICE TEST COMPLETE - All operations successful');
      console.log(`🔄 Redirecting to: /bean/${testBean.id}`);
      
      // Redirect to the test bean page
      setTimeout(() => {
        router.push(`/bean/${testBean.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('💥 SERVICE TEST FAILED at step:', error);
      
      // Enhanced error reporting
      let errorDetails = `Unknown error: ${String(error)}`;
      
      if (error instanceof Error) {
        errorDetails = error.message;
        console.error('🔍 Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      toast({
        title: "❌ Service Test Failed",
        description: errorDetails,
        variant: "destructive",
      });
      
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Service test cleanup completed');
    }
  };

  // ENHANCED FORM SUBMISSION with bullet-proof error handling
  const onSubmit = async (data: AddBeanFormData) => {
    // Immediate feedback to show button click was registered
    console.log('🚀 FORM SUBMISSION INITIATED');
    console.log('📊 Submission attempt:', submitAttempts + 1);
    console.log('👤 User:', user?.id);
    console.log('📝 Form data received:', data);
    
    setSubmitAttempts(prev => prev + 1);
    
    // Critical: Set loading state immediately to prevent double submissions
    if (isSubmitting) {
      console.log('⚠️ Already submitting, ignoring duplicate request');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Step 1: Authentication check
      if (!user) {
        throw new Error("You must be logged in to add a coffee bean");
      }
      
      console.log('✅ User authenticated:', user.id);
      
      // Step 2: Show initial feedback
      toast({
        title: "🚀 Processing Submission",
        description: "Validating form and creating coffee bean...",
      });
      
      // Step 3: Enhanced form validation with explicit error handling
      console.log('🔍 Starting form validation...');
      const isValid = await form.trigger();
      const errors = form.formState.errors;
      
      console.log('📋 Form validation result:', { isValid, errors });
      
      if (!isValid || Object.keys(errors).length > 0) {
        console.log('❌ Form validation failed:', errors);
        const firstErrorKey = Object.keys(errors)[0];
        const firstError = errors[firstErrorKey as keyof typeof errors];
        const errorMessage = firstError?.message || "Please check all required fields";
        throw new Error(`Validation Error: ${errorMessage}`);
      }
      
      console.log('✅ Form validation passed');
      
      // Step 4: Sanitize and prepare bean data with explicit type conversion
      console.log('🧹 Sanitizing form data...');
      const beanData = {
        name: String(data.name || '').trim(),
        brand: String(data.brand || '').trim(),
        origin: data.origin ? String(data.origin).trim() : null,
        region: data.region ? String(data.region).trim() : null,
        altitude: data.altitude ? String(data.altitude).trim() : null,
        processing_method: data.processing_method || null,
        roast_level: data.roast_level || null,
        roast_date: data.roast_date || null,
        harvest_date: data.harvest_date ? String(data.harvest_date).trim() : null,
        description: data.description ? String(data.description).trim() : null,
        flavor_notes: Array.isArray(data.flavor_notes) ? data.flavor_notes : [],
        price: typeof data.price === 'number' ? data.price : null,
        price_per_unit: data.price_per_unit || null,
        purchase_url: data.purchase_url ? String(data.purchase_url).trim() : null,
        is_available: Boolean(data.is_available ?? true),
      };
      
      // Validate required fields
      if (!beanData.name || !beanData.brand) {
        throw new Error("Bean name and brand are required");
      }
      
      console.log('☕ Creating bean with sanitized data:', beanData);
      
      // Step 5: Create coffee bean with enhanced error handling
      toast({
        title: "☕ Creating Coffee Bean",
        description: "Adding your coffee bean to the database...",
      });
      
      let newBean;
      try {
        newBean = await coffeeBeansService.createCoffeeBean(beanData, imageFiles[0] || null);
        console.log('✅ Coffee bean created successfully:', newBean);
      } catch (beanError) {
        console.error('💥 Bean creation failed:', beanError);
        throw new Error(`Failed to create coffee bean: ${beanError instanceof Error ? beanError.message : 'Unknown error'}`);
      }
      
      // Step 6: Create rating with enhanced error handling and type safety
      toast({
        title: "⭐ Adding Rating",
        description: "Saving your detailed rating...",
      });
      
      console.log('⭐ Preparing rating data...');
      const ratingData = {
        user_id: String(user.id),
        coffee_bean_id: String(newBean.id),
        overall_rating: Math.round((Number(data.overall_rating) || 3.5) * 10) / 10,
        aroma_rating: data.aroma_rating ? Math.round(Number(data.aroma_rating) * 10) / 10 : null,
        flavor_rating: data.flavor_rating ? Math.round(Number(data.flavor_rating) * 10) / 10 : null,
        aftertaste_rating: data.aftertaste_rating ? Math.round(Number(data.aftertaste_rating) * 10) / 10 : null,
        acidity_rating: data.acidity_rating ? Math.round(Number(data.acidity_rating) * 10) / 10 : null,
        body_rating: data.body_rating ? Math.round(Number(data.body_rating) * 10) / 10 : null,
        sweetness_rating: data.sweetness_rating ? Math.round(Number(data.sweetness_rating) * 10) / 10 : null,
        balance_rating: data.balance_rating ? Math.round(Number(data.balance_rating) * 10) / 10 : null,
        brewing_method: data.brewing_method ? String(data.brewing_method).trim() : null,
        grinder: data.grinder ? String(data.grinder).trim() : null,
        grind_size: data.grind_size ? String(data.grind_size).trim() : null,
        water_temp: data.water_temp ? Number(data.water_temp) : null,
        brew_ratio: data.brew_ratio ? String(data.brew_ratio).trim() : null,
        review_text: data.review_text ? String(data.review_text).trim() : null,
      };
      
      console.log('⭐ Creating rating with sanitized data:', ratingData);
      
      let rating;
      try {
        rating = await ratingsService.createRating(ratingData);
        console.log('✅ Rating created successfully:', rating);
      } catch (ratingError) {
        console.error('💥 Rating creation failed:', ratingError);
        console.warn('⚠️ Bean was created but rating failed - this is recoverable');
        // Don't throw error here - bean was successfully created
        toast({
          title: "⚠️ Partial Success",
          description: `Coffee bean "${data.name}" was created, but rating failed. You can add a rating later.`,
          variant: "destructive",
        });
        
        // Still redirect to the bean page
        setTimeout(() => {
          router.push(`/bean/${newBean.id}`);
        }, 3000);
        return;
      }
      
      // Step 7: Complete Success!
      toast({
        title: "🎉 Success!",
        description: `"${data.name}" by ${data.brand} has been added successfully!`,
      });
      
      console.log('🎉 Submission completed successfully');
      console.log('🔄 Redirecting to bean page:', `/bean/${newBean.id}`);
      
      // Redirect with delay for user to see success message
      setTimeout(() => {
        router.push(`/bean/${newBean.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('💥 SUBMISSION ERROR:', error);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('🔍 Detailed error info:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Specific error handling
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          errorMessage = "A coffee bean with this name and brand already exists.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('authentication') || error.message.includes('logged in')) {
          errorMessage = "Please log in to add a coffee bean.";
        } else if (error.message.includes('Validation Error')) {
          errorMessage = error.message.replace('Validation Error: ', '');
        }
      }
      
      toast({
        title: "❌ Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Form submission process completed');
    }
  };

  // Enhanced form submission handler with extra safety
  const handleFormSubmit = async (e?: React.FormEvent) => {
    console.log('🔥 Form submit handler called');
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Get current form data
    const formData = form.getValues();
    console.log('📋 Current form data:', formData);
    
    // Call our enhanced submit function
    await onSubmit(formData);
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

  // COMPREHENSIVE TEST FUNCTION - bypasses image upload to test core functionality
  const comprehensiveTest = async () => {
    console.log('🔧 COMPREHENSIVE TEST - Testing Core Submission Without Images');
    
    setSubmitAttempts(prev => prev + 1);
    setIsSubmitting(true);
    
    try {
      toast({
        title: "🔧 Testing Core Functionality",
        description: "Testing bean + rating creation without image upload...",
      });

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Test with current form data, but no images
      const currentFormData = form.getValues();
      console.log('📋 Current form data for test:', currentFormData);
      
      // Step 1: Validate form data
      console.log('🔍 Testing form validation...');
      const isValid = await form.trigger();
      const errors = form.formState.errors;
      
      if (!isValid || Object.keys(errors).length > 0) {
        console.log('❌ Form validation failed:', errors);
        throw new Error(`Form validation failed: ${JSON.stringify(errors)}`);
      }
      
      console.log('✅ Form validation passed');
      
      // Step 2: Sanitize bean data (NO IMAGE)
      const beanData = {
        name: String(currentFormData.name || 'Test Bean ' + Date.now()).trim(),
        brand: String(currentFormData.brand || 'Test Roaster').trim(),
        origin: currentFormData.origin ? String(currentFormData.origin).trim() : 'Test Origin',
        region: currentFormData.region ? String(currentFormData.region).trim() : null,
        altitude: currentFormData.altitude ? String(currentFormData.altitude).trim() : null,
        processing_method: currentFormData.processing_method || null,
        roast_level: currentFormData.roast_level || null,
        roast_date: currentFormData.roast_date || null,
        harvest_date: currentFormData.harvest_date ? String(currentFormData.harvest_date).trim() : null,
        description: currentFormData.description ? String(currentFormData.description).trim() : 'Comprehensive test submission',
        flavor_notes: Array.isArray(currentFormData.flavor_notes) ? currentFormData.flavor_notes : [],
        price: typeof currentFormData.price === 'number' ? currentFormData.price : null,
        price_per_unit: currentFormData.price_per_unit || null,
        purchase_url: currentFormData.purchase_url ? String(currentFormData.purchase_url).trim() : null,
        is_available: Boolean(currentFormData.is_available ?? true),
      };
      
      console.log('☕ Testing bean creation with data:', beanData);
      
      // Step 3: Create bean (NO IMAGE UPLOAD)
      const testBean = await coffeeBeansService.createCoffeeBean(beanData, null);
      console.log('✅ Bean created successfully:', testBean);
      
      // Step 4: Create rating
      const ratingData = {
        user_id: String(user.id),
        coffee_bean_id: String(testBean.id),
        overall_rating: Number(currentFormData.overall_rating) || 4.0,
        aroma_rating: currentFormData.aroma_rating ? Number(currentFormData.aroma_rating) : null,
        flavor_rating: currentFormData.flavor_rating ? Number(currentFormData.flavor_rating) : null,
        aftertaste_rating: currentFormData.aftertaste_rating ? Number(currentFormData.aftertaste_rating) : null,
        acidity_rating: currentFormData.acidity_rating ? Number(currentFormData.acidity_rating) : null,
        body_rating: currentFormData.body_rating ? Number(currentFormData.body_rating) : null,
        sweetness_rating: currentFormData.sweetness_rating ? Number(currentFormData.sweetness_rating) : null,
        balance_rating: currentFormData.balance_rating ? Number(currentFormData.balance_rating) : null,
        brewing_method: currentFormData.brewing_method ? String(currentFormData.brewing_method).trim() : null,
        grinder: currentFormData.grinder ? String(currentFormData.grinder).trim() : null,
        grind_size: currentFormData.grind_size ? String(currentFormData.grind_size).trim() : null,
        water_temp: currentFormData.water_temp ? Number(currentFormData.water_temp) : null,
        brew_ratio: currentFormData.brew_ratio ? String(currentFormData.brew_ratio).trim() : null,
        review_text: currentFormData.review_text ? String(currentFormData.review_text).trim() : 'Comprehensive test rating',
      };
      
      console.log('⭐ Testing rating creation with data:', ratingData);
      
      const testRating = await ratingsService.createRating(ratingData);
      console.log('✅ Rating created successfully:', testRating);
      
      // Step 5: Success!
      toast({
        title: "🎉 Core Test Passed!",
        description: `Bean "${testBean.name}" and rating created successfully! Redirecting...`,
      });
      
      console.log('🔧 COMPREHENSIVE TEST PASSED - Core functionality working');
      console.log(`🔄 Redirecting to: /bean/${testBean.id}`);
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/bean/${testBean.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('💥 COMPREHENSIVE TEST FAILED:', error);
      
      let errorMessage = `Core test failed: ${String(error)}`;
      
      if (error instanceof Error) {
        errorMessage = `Core test failed: ${error.message}`;
        console.error('🔍 Test error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      toast({
        title: "❌ Core Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Comprehensive test completed');
    }
  };

  if (!user) {
    return (
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Debug Info */}
      {submitAttempts > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Debug: Submission attempts: {submitAttempts} | 
            User ID: {user?.id?.slice(0, 8)}... | 
            Form valid: {form.formState.isValid ? '✅' : '❌'} |
            Errors: {Object.keys(form.formState.errors).length}
          </p>
        </div>
      )}

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
            {/* Comprehensive Test Button - tests core functionality without images */}
            <Button
              type="button"
              variant="secondary"
              onClick={comprehensiveTest}
              disabled={isSubmitting}
              className="px-6 bg-green-100 hover:bg-green-200 text-green-800"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Testing...
                </>
              ) : (
                "🔧 Test Core (No Images)"
              )}
            </Button>

            {/* Original Test Submit Button for debugging */}
            <Button
              type="button"
              variant="secondary"
              onClick={testSubmit}
              disabled={isSubmitting}
              className="px-6"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Testing...
                </>
              ) : (
                "🧪 Test Submit"
              )}
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
              onClick={handleFormSubmit}
              className="px-8 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 relative"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                "Add Coffee Bean ☕"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}