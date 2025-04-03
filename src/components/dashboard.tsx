
import { useState } from "react";
import { UploadPrototypeDialog } from "@/components/upload-prototype-dialog";
import { useClerkAuth } from "@/lib/clerk-provider";
import { PrototypeGrid } from "./prototype-grid";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationBell } from "./notification/notification-bell";
import { ProfileDropdown } from "./profile/profile-dropdown";
import { Plus } from "lucide-react";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useClerkAuth();
  const queryClient = useQueryClient();

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Prototypes</h1>
          <p className="text-muted-foreground">
            Manage and showcase your interactive prototypes.
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <NotificationBell />
          <ProfileDropdown />
          <UploadPrototypeDialog
            onUpload={() => {
              queryClient.invalidateQueries({ queryKey: ["prototypes"] });
            }}
          />
        </div>
      </div>

      <PrototypeGrid />
    </div>
  );
};

export default Dashboard;
