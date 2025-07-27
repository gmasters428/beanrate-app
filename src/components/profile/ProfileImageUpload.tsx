import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Upload, Trash2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { userService } from "@/services/userService";

interface ProfileImageUploadProps {
  userId: string;
  currentImageUrl?: string | null;
  onImageUpdate: (newImageUrl: string | null) => void;
  size?: "sm" | "md" | "lg";
}

export default function ProfileImageUpload({ 
  userId, 
  currentImageUrl, 
  onImageUpdate,
  size = "lg" 
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16", 
    lg: "h-24 w-24"
  };

  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setError(null);

    // More specific file type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError(`File type "${file.type}" is not supported. Please use JPEG, PNG, WebP, or GIF.`);
      return;
    }

    // Validate file size (10MB limit - increased from 5MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File size (${fileSizeMB}MB) exceeds the 10MB limit. Please choose a smaller image.`);
      return;
    }

    try {
      setIsUploading(true);
      
      const newImageUrl = await userService.uploadProfileImage(userId, file);
      onImageUpdate(newImageUrl);
      setShowActions(false);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      // Provide more specific error messages based on the error
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error?.message) {
        if (error.message.includes('storage')) {
          errorMessage = 'Storage error: Unable to save the image. Please try again.';
        } else if (error.message.includes('size')) {
          errorMessage = 'File size error: The image is too large.';
        } else if (error.message.includes('format') || error.message.includes('type')) {
          errorMessage = 'File format error: Please use a supported image format.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error: Please check your connection and try again.';
        } else {
          errorMessage = `Upload failed: ${error.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setIsUploading(true);
      setError(null);
      
      await userService.removeProfileImage(userId);
      onImageUpdate(null);
      setShowActions(false);
    } catch (error) {
      console.error('Error removing image:', error);
      setError('Failed to remove image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <div 
        className={`${sizeClasses[size]} rounded-full border-4 border-white overflow-hidden relative bg-white cursor-pointer group`}
        onClick={() => setShowActions(!showActions)}
      >
        {currentImageUrl ? (
          <Image 
            src={currentImageUrl} 
            alt="Profile" 
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
            <UserIcon className={`${iconSizes[size]} text-gray-500`} />
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-6 w-6 text-white" />
        </div>
        
        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && !isUploading && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-lg border p-2 z-10">
          <div className="flex flex-col space-y-2 min-w-[120px]">
            <Button
              size="sm"
              variant="ghost"
              onClick={triggerFileInput}
              className="justify-start"
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentImageUrl ? 'Change' : 'Upload'}
            </Button>
            
            {currentImageUrl && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemoveImage}
                className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Click outside to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
}
