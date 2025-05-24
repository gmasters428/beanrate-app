import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const coffeeTypes = [
  "Arabica",
  "Robusta", 
  "Single Origin",
  "Blend",
  "Light Roast",
  "Medium Roast",
  "Dark Roast",
  "Espresso",
  "Cold Brew",
  "French Press"
];

const regions = [
  "Northeast",
  "Southeast", 
  "Midwest",
  "Southwest",
  "West Coast",
  "Pacific Northwest",
  "Mountain West",
  "International"
];

export default function ProfileSettingsPage() {
  const { user, updateUser, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    region: "",
    coffeeTypes: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      setFormData({
        firstName: user.preferences?.firstName || "",
        lastName: user.preferences?.lastName || "",
        bio: user.bio || "",
        region: user.preferences?.region || "",
        coffeeTypes: user.preferences?.coffeeTypes || []
      });
    }
  }, [user, isAuthenticated, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      region: value
    }));
  };

  const handleCoffeeTypeChange = (coffeeType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      coffeeTypes: checked 
        ? [...prev.coffeeTypes, coffeeType]
        : prev.coffeeTypes.filter(type => type !== coffeeType)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    try {
      // Mock save - in real app, this would call your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateUser({
        bio: formData.bio,
        preferences: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          region: formData.region,
          coffeeTypes: formData.coffeeTypes
        }
      });

      setSaveMessage("Profile updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="BeanRate - Loading...">
        <div className="max-w-md mx-auto flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Layout title="BeanRate - Profile Settings">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Profile Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {saveMessage && (
                <Alert className={saveMessage.includes("successfully") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription className={saveMessage.includes("successfully") ? "text-green-700" : "text-red-700"}>
                    {saveMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself and your coffee journey..."
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select value={formData.region} onValueChange={handleRegionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Coffee Preferences</Label>
                <div className="grid grid-cols-2 gap-2">
                  {coffeeTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={formData.coffeeTypes.includes(type)}
                        onCheckedChange={(checked) => 
                          handleCoffeeTypeChange(type, checked as boolean)
                        }
                      />
                      <Label htmlFor={type} className="text-sm">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-brown-600 hover:bg-brown-700"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}