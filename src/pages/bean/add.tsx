
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { coffeeBeansService } from "@/services/coffeeBeansService";
import { ratingsService } from "@/services/ratingsService";
import { Coffee, Upload, Star, X } from "lucide-react";
import Layout from "@/components/layout/Layout";

const addBeanSchema = z.object({
  // Bean details
  name: z.string().min(1, "Bean name is required"),
  brand: z.string().min(1, "Brand/Roaster is required"),
  origin: z.string().optional(),
  roast_level: z.enum(["light", "medium-light", "medium", "medium-dark", "dark"]).optional(),
  description: z.string().optional(),
  flavor_notes: z.array(z.string()).optional(),
  
  // Rating details
  overall_rating: z.number().min(1).max(5),
  aroma_rating: z.number().min(1).max(5).optional(),
  flavor_rating: z.number().min(1).max(5).optional(),
  aftertaste_rating: z.number().min(1).max(5).optional(),
  acidity_rating: z.number().min(1).max(5).optional(),
  body_rating: z.number().min(1).max(5).optional(),
  brewing_method: z.string().optional(),
  grinder: z.string().optional(),
  grind_size: z.string().optional(),
  review_text: z.string().optional(),
});

type AddBeanFormData = z.infer<typeof addBeanSchema>;

const roastLevels = [
  { value: "light", label: "Light Roast" },
  { value: "medium-light", label: "Medium-Light Roast" },
  { value: "medium", label: "Medium Roast" },
  { value: "medium-dark", label: "Medium-Dark Roast" },
  { value: "dark", label: "Dark Roast" },
];

const brewingMethods = [
  "Espresso", "Pour Over", "French Press", "AeroPress", "Chemex", 
  "V60", "Drip Coffee", "Cold Brew", "Moka Pot", "Turkish Coffee"
];

const grindSizes = [
  "Extra Coarse", "Coarse", "Medium-Coarse", "Medium", 
  "Medium-Fine", "Fine", "Extra Fine"
];

export default function AddBeanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [flavorNoteInput, setFlavorNoteInput] = useState("");

  const form = useForm<AddBeanFormData>({
    resolver: zodResolver(addBeanSchema),
    defaultValues: {
      overall_rating: 3.0,
      aroma_rating: 3.0,
      flavor_rating: 3.0,
      aftertaste_rating: 3.0,
      acidity_rating: 3.0,
      body_rating: 3.0,
      flavor_notes: [],
    },
  });

  const flavorNotes = form.watch("flavor_notes") || [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFlavorNote = () => {
    if (flavorNoteInput.trim() && !flavorNotes.includes(flavorNoteInput.trim())) {
      form.setValue("flavor_notes", [...flavorNotes, flavorNoteInput.trim()]);
      setFlavorNoteInput("");
    }
  };

  const removeFlavorNote = (note: string) => {
    form.setValue("flavor_notes", flavorNotes.filter(n => n !== note));
  };

  const onSubmit = async (data: AddBeanFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add a coffee bean.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the coffee bean
      const beanData = {
        name: data.name,
        brand: data.brand,
        origin: data.origin,
        roast_level: data.roast_level,
        description: data.description,
        flavor_notes: data.flavor_notes || [],
      };

      const newBean = await coffeeBeansService.createCoffeeBean(beanData, imageFile);

      // Create the rating
      const ratingData = {
        user_id: user.id, // Add this line
        coffee_bean_id: newBean.id,
        overall_rating: data.overall_rating,
        aroma_rating: data.aroma_rating,
        flavor_rating: data.flavor_rating,
        aftertaste_rating: data.aftertaste_rating,
        acidity_rating: data.acidity_rating,
        body_rating: data.body_rating,
        brewing_method: data.brewing_method,
        grinder: data.grinder,
        grind_size: data.grind_size,
        review_text: data.review_text,
      };

      await ratingsService.createRating(ratingData);

      toast({
        title: "Success!",
        description: "Coffee bean added successfully with your rating.",
      });

      router.push(`/bean/${newBean.id}`);
    } catch (error) {
      console.error("Error adding coffee bean:", error);
      toast({
        title: "Error",
        description: "Failed to add coffee bean. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingSlider = ({ name, label }: { name: keyof AddBeanFormData; label: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center justify-between">
            {label}
            <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {typeof field.value === "number" ? field.value.toFixed(1) : "3.0"}
            </span>
          </FormLabel>
          <FormControl>
            <Slider
              min={1}
              max={5}
              step={0.1}
              value={[typeof field.value === "number" ? field.value : 3]}
              onValueChange={(value) => field.onChange(value[0])}
              className="w-full"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please log in to add a coffee bean.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Coffee className="h-8 w-8" />
            Add a New Coffee Bean
          </h1>
          <p className="text-muted-foreground">
            Share a new coffee bean with the community and add your first rating.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Bean Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Bean Information</CardTitle>
                <CardDescription>
                  Tell us about this coffee bean
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bean Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Ethiopian Yirgacheffe" {...field} />
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
                        <FormLabel>Brand/Roaster *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Blue Bottle Coffee" {...field} />
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
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Ethiopia, Yirgacheffe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roast_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roast Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select roast level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roastLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this coffee bean..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Flavor Notes */}
                <div className="space-y-3">
                  <FormLabel>Flavor Notes</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a flavor note..."
                      value={flavorNoteInput}
                      onChange={(e) => setFlavorNoteInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFlavorNote())}
                    />
                    <Button type="button" onClick={addFlavorNote} variant="outline">
                      Add
                    </Button>
                  </div>
                  {flavorNotes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {flavorNotes.map((note) => (
                        <Badge key={note} variant="secondary" className="flex items-center gap-1">
                          {note}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeFlavorNote(note)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                  <FormLabel>Bean Image</FormLabel>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  {imagePreview && (
                    <div className="mt-4 relative w-32 h-32">
                      <Image
                        src={imagePreview}
                        alt="Bean preview"
                        fill
                        className="object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rating Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Your Rating
                </CardTitle>
                <CardDescription>
                  Rate this coffee bean based on your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RatingSlider name="overall_rating" label="Overall Rating" />
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RatingSlider name="aroma_rating" label="Aroma" />
                  <RatingSlider name="flavor_rating" label="Flavor" />
                  <RatingSlider name="aftertaste_rating" label="Aftertaste" />
                  <RatingSlider name="acidity_rating" label="Acidity" />
                  <RatingSlider name="body_rating" label="Body" />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="brewing_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brewing Method</FormLabel>
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
                        <FormLabel>Grinder</FormLabel>
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
                        <FormLabel>Grind Size</FormLabel>
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
                </div>

                <FormField
                  control={form.control}
                  name="review_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tasting Notes & Review</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your detailed thoughts about this coffee..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe the taste, aroma, and your overall experience with this coffee.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding Bean..." : "Add Coffee Bean"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}