
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useClerkAuth } from "@/lib/clerk-provider"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useUser, useClerk } from "@clerk/clerk-react"

export function ProfileDropdown() {
  const { user } = useClerkAuth()
  const { user: clerkUser } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const profileName = clerkUser?.firstName ? 
    `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : 
    user?.email?.split('@')[0] || 'Guest';
    
  const profileAvatar = clerkUser?.imageUrl || user?.user_metadata?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
          <Avatar className="h-8 w-8">
            {profileAvatar ? (
              <AvatarImage src={profileAvatar} alt={profileName} />
            ) : (
              <AvatarFallback>{profileName?.slice(0, 2).toUpperCase() || "US"}</AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profileName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {clerkUser?.primaryEmailAddress?.emailAddress || user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoading} onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
