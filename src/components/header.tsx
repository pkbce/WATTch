
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Settings,
  LogOut,
  User,
  KeyRound,
  Trash2,
  Wifi,
  Bolt,
  LineChart,
  LayoutDashboard,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SupplierSettings } from '@/components/supplier-settings';
import { ChangeNetworkDialog } from '@/components/change-network-dialog';
import { ChangeUsernameDialog } from '@/components/change-username-dialog';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { DeleteAccountDialog } from '@/components/delete-account-dialog';
import { useTheme } from '@/components/theme-provider';
import { useLaravelAuth } from '@/components/LaravelAuthContext';

const Logo = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="hsl(var(--primary))"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M23.3334 3.33331L6.66675 21.6666H20L16.6667 36.6666L33.3334 18.3333H20L23.3334 3.33331Z"
      stroke="hsl(var(--primary))"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface HeaderProps {
  rate: number;
  setRate: (rate: number) => void;
}

export function Header({ rate, setRate }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useLaravelAuth();

  const handleLogout = () => {
    logout();
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  const menuItemClassName = "focus:bg-blue-400/20 hover:bg-blue-400/20 dark:focus:text-foreground focus:text-current";
  const iconButtonClassName = "hover:bg-muted dark:hover:text-current hover:text-foreground";

  return (
    <header className="p-6 md:p-10 flex justify-between items-center">
      <div className="flex items-center gap-10">
        <div className="flex items-center justify-start md:justify-start gap-3">
          <Logo />
          <h1 className="text-[34px] lg:text-[46px] font-bold text-left md:text-left tracking-tighter text-foreground font-space">
            WATTch
          </h1>
        </div>
      </div>
      <TooltipProvider>
        <div className="flex items-center gap-2">
          {pathname === '/' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/total-consumption">
                  <Button variant="ghost" size="icon" className={iconButtonClassName}>
                    <LineChart className="h-6 w-6" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Total consumption</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <Button variant="ghost" size="icon" className={iconButtonClassName}>
                    <LayoutDashboard className="h-6 w-6" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Dashboard</p>
              </TooltipContent>
            </Tooltip>
          )}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={iconButtonClassName}>
                    <Settings className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              ) : (
                <DropdownMenuLabel>Not Logged In</DropdownMenuLabel>
              )}
              <DropdownMenuItem onClick={handleThemeToggle} className={menuItemClassName}>
                {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>{theme === 'dark' ? "Light Mode" : "Dark Mode"}</span>
              </DropdownMenuItem>
              <ChangeNetworkDialog>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className={menuItemClassName}>
                  <Wifi className="mr-2 h-4 w-4" />
                  <span>Change Network</span>
                </DropdownMenuItem>
              </ChangeNetworkDialog>
              <SupplierSettings rate={rate} setRate={setRate}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className={menuItemClassName}>
                  <Bolt className="mr-2 h-4 w-4" />
                  <span>Change Supplier</span>
                </DropdownMenuItem>
              </SupplierSettings>
              {user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Account Settings</DropdownMenuLabel>
                    <ChangeUsernameDialog>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className={menuItemClassName}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Change Username</span>
                      </DropdownMenuItem>
                    </ChangeUsernameDialog>
                    <ChangePasswordDialog>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className={menuItemClassName}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        <span>Change Password</span>
                      </DropdownMenuItem>
                    </ChangePasswordDialog>
                    <DeleteAccountDialog>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive hover:bg-destructive/20 focus:text-destructive focus:bg-destructive/20"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Account</span>
                      </DropdownMenuItem>
                    </DeleteAccountDialog>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className={menuItemClassName}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>
    </header>
  );
}
