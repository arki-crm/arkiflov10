import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Search, LogOut, Bell, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ROLE_BADGE_STYLES = {
  Admin: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  Designer: 'bg-pink-100 text-pink-700',
  PreSales: 'bg-orange-100 text-orange-700',
  Trainee: 'bg-green-100 text-green-700'
};

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/unread-count`, { 
        withCredentials: true 
      });
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      // Silently fail - user might not be authenticated yet
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header 
      className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50"
      data-testid="header"
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* User Profile Section */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <Button 
            variant="ghost" 
            size="sm"
            className="relative h-9 w-9 p-0"
            onClick={() => navigate('/notifications')}
            data-testid="notifications-bell"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Role Badge */}
          {user?.role && (
            <span 
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                ROLE_BADGE_STYLES[user.role] || 'bg-slate-100 text-slate-700'
              )}
              data-testid="role-badge"
            >
              {user.role}
            </span>
          )}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-9 w-9 rounded-full"
                data-testid="user-menu-trigger"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-slate-900">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-slate-500">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/notifications')}
                className="cursor-pointer"
              >
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                data-testid="logout-button"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
