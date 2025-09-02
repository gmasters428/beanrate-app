
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { userService } from "@/services/userService";
import { authService } from "@/services/authService";

interface DeleteAccountDialogProps {
  userId: string;
  userEmail: string;
  onAccountDeleted: () => void;
}

export default function DeleteAccountDialog({
  userId,
  userEmail,
  onAccountDeleted
}: DeleteAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  
  const isConfirmationValid = confirmationEmail.toLowerCase() === userEmail.toLowerCase();

  const handleDeleteAccount = async () => {
    if (!isConfirmationValid) {
      setError("Email confirmation does not match your account email");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      // Delete all user data
      await userService.deleteUserAccount(userId);
      
      // Sign out the user
      await authService.signOut();
      
      // Notify parent component
      onAccountDeleted();
      
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setError(error.message || "Failed to delete account. Please try again or contact support.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setConfirmationEmail("");
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full bg-red-600 hover:bg-red-700 border-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-left">
            This action cannot be undone. This will permanently delete your account and all associated data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <div className="space-y-1">
                <p className="font-medium">This will permanently delete:</p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li>All your coffee ratings and reviews</li>
                  <li>All your comments and interactions</li>
                  <li>Your friends and friend requests</li>
                  <li>Your profile and preferences</li>
                  <li>Your account login credentials</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirmEmail" className="text-sm font-medium">
              To confirm deletion, please enter your email address:
            </Label>
            <Input
              id="confirmEmail"
              type="email"
              placeholder={userEmail}
              value={confirmationEmail}
              onChange={(e) => setConfirmationEmail(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Enter: {userEmail}
            </p>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            disabled={isDeleting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!isConfirmationValid || isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Forever
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
