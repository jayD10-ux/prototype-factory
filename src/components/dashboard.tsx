
// Adding navigation link to the validation test page
import { PrototypeGrid } from "@/components/prototype-grid";
import { ProfileDropdown } from "./profile/profile-dropdown";
import { NotificationBell } from "./notification/notification-bell";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useSupabase } from "@/lib/supabase-provider";

export default function Dashboard() {
  const { isAuthenticated, session } = useSupabase();

  return (
    <>
      <header className="w-full p-4 backdrop-blur-lg backdrop-saturate-150 bg-white/75 border-b z-10 sticky top-0 flex justify-between items-center">
        <div className="container mx-auto flex justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-semibold text-lg">
              Prototype App
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {!isAuthenticated ? (
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            ) : (
              <>
                <NotificationBell />
                <ProfileDropdown />
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1">
        <PrototypeGrid />
      </div>
    </>
  );
}
