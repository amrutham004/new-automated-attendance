/**
 * Header.tsx - Navigation Header Component
 * 
 * Displays the app header with:
 * - School logo and name
 * - Navigation links for all pages
 * - Mobile-responsive hamburger menu
 * 
 * No authentication - all routes are accessible to everyone
 */

import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ClipboardCheck, LayoutDashboard, User, Menu, X, ScanLine } from 'lucide-react';
import { useState } from 'react';
const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // All navigation links available to everyone
  const navLinks = [{
    to: '/',
    label: 'Home',
    icon: Home
  }, {
    to: '/mark-attendance',
    label: 'Mark Attendance',
    icon: ClipboardCheck
  }, {
    to: '/student',
    label: 'Student Dashboard',
    icon: User
  }, {
    to: '/admin',
    label: 'Admin Dashboard',
    icon: LayoutDashboard
  }, {
    to: '/scan-student',
    label: 'Scan Student',
    icon: ScanLine
  }];

  // Check if a nav link is currently active
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and School Name */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-shadow">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold font-display bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
              AttendaGo
            </h1>
          </div>
        </Link>

        {/* Desktop Navigation - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Button 
              key={to} 
              variant="ghost" 
              size="sm" 
              asChild
              className={`
                text-cyan-100/70 hover:text-white hover:bg-white/10
                ${isActive(to) ? 'bg-white/10 text-white' : ''}
              `}
            >
              <Link to={to} className="flex items-center gap-2">
                <Icon size={16} />
                {label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Mobile Menu Toggle Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-cyan-100 hover:text-white hover:bg-white/10" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl animate-fade-in">
          <div className="container py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Button 
                key={to} 
                variant="ghost" 
                className={`
                  w-full justify-start text-cyan-100/70 hover:text-white hover:bg-white/10
                  ${isActive(to) ? 'bg-white/10 text-white' : ''}
                `}
                asChild 
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to={to} className="flex items-center gap-2">
                  <Icon size={18} />
                  {label}
                </Link>
              </Button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
export default Header;