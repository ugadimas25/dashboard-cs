import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu,
  PieChart,
  Sprout,
  Upload
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import logo from "@assets/farmforce_logo_1765810103435.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <img 
            src={logo}
            alt="Farmforce" 
            className="h-8 w-auto object-contain"
          />
        </div>
        
        <div className="space-y-1">
          <Link href="/">
            <Button 
              variant={location === "/" ? "secondary" : "ghost"} 
              className={cn("w-full justify-start gap-2", location === "/" && "font-semibold")}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Button>
          </Link>
          <Link href="/analytics">
            <Button 
              variant={location === "/analytics" ? "secondary" : "ghost"} 
              className="w-full justify-start gap-2"
            >
              <PieChart size={18} />
              Analytics
            </Button>
          </Link>
          <Link href="/sustainability">
            <Button 
              variant={location === "/sustainability" ? "secondary" : "ghost"} 
              className="w-full justify-start gap-2"
            >
              <Sprout size={18} />
              Sustainability
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={logout}>
          <LogOut size={18} />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0 fixed inset-y-0 left-0 z-50">
        <NavContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b p-4 flex items-center justify-between">
        <img 
          src={logo}
          alt="Farmforce" 
          className="h-6 w-auto object-contain"
        />
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-8 pt-20 md:pt-8 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}
