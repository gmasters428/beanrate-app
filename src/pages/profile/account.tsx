import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import ProfileImageUpload from "@/components/profile/ProfileImageUpload";
import DeleteAccountDialog from "@/components/profile/DeleteAccountDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, User as UserIcon, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
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

export default function ProfileAccountPage() {
  const { user, refreshUser, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    region: "",
    coffeeTypes: [] as string[]
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      setFormData({
        firstName: user.preferences?.firstName || "",
        region: user.preferences?.region || "",
        coffeeTypes: user.preferences?.coffeeTypes || []
      });
      setProfileImageUrl(user.profileImage || null);
    }
  }, [user, loading, router]);

  const handleImageUpdate = async (newImageUrl: string | null) => {
    setProfileImageUrl(newImageUrl);
    // Refresh user data to get updated profile
    await refreshUser();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (!user) {
        throw new Error("User not found");
      }

      // Update user preferences
      await userService.updatePreferences(user.id, {
        first_name: formData.firstName.trim() || null,
        last_name: null,
        region: formData.region || null,
        coffee_types: formData.coffeeTypes.length > 0 ? formData.coffeeTypes : null
      });

      // Refresh user data to show updated information
      await refreshUser();

      setSaveMessage("Profile updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveMessage("Failed to update profile. Please try again.");
      setTimeout(() => setSaveMessage(""), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccountDeleted = () => {
    // Redirect to home page after account deletion
    router.push("/");
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

  if (!user) {
    return null;
  }

  const displayName = user.preferences?.firstName 
    ? user.preferences.firstName
    : user.name;

  return (
    <Layout title="BeanRate - Account Settings">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <ProfileImageUpload
                userId={user.id}
                currentImageUrl={profileImageUrl}
                onImageUpdate={handleImageUpdate}
                size="lg"
              />
              <div className="text-center">
                <h3 className="font-medium text-gray-900">{displayName}</h3>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <p className="text-sm text-gray-600">All fields are optional. Only fill out what you're comfortable sharing.</p>
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
                <p className="text-xs text-gray-500">We only show general regions to protect your privacy</p>
              </div>

              <div className="space-y-3">
                <Label>Coffee Preferences</Label>
                <p className="text-xs text-gray-500">Help others discover your coffee taste profile</p>
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

        {/* Account Security Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Account Security</CardTitle>
            <p className="text-sm text-gray-600">Manage your email, password, and account settings.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Address</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                <Link href="/auth/reset-password">
                  <Button variant="outline" size="sm">
                    Change Email
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-xs text-gray-600">Last updated recently</p>
                </div>
                <Link href="/auth/reset-password">
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Danger Zone
            </CardTitle>
            <p className="text-sm text-red-600">
              These actions are permanent and cannot be undone.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white border border-red-200 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Delete Account</h4>
                    <p className="text-sm text-gray-600">
                      Permanently remove your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <DeleteAccountDialog
                    userId={user.id}
                    userEmail={user.email}
                    onAccountDeleted={handleAccountDeleted}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
