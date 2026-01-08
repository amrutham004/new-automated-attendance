import { Link, useLocation, useNavigate } from 'react-router-dom';
import SchoolLogo from './SchoolLogo';
import { Button } from '@/components/ui/button';
import { Home, ClipboardCheck, LayoutDashboard, User, Menu, X, LogOut, ScanLine } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut, user } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define nav links based on role
  const studentNavLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/mark-attendance', label: 'Mark Attendance', icon: ClipboardCheck },
    { to: '/student', label: 'My Dashboard', icon: User },
  ];

  const teacherNavLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/scan-student', label: 'Scan Student', icon: ScanLine },
  ];

  const navLinks = role === 'teacher' ? teacherNavLinks : studentNavLinks;

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to={role === 'teacher' ? '/admin' : '/'} className="flex items-center gap-3">
          <SchoolLogo size="small" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold font-display text-foreground">Rural School</h1>
            <p className="text-xs text-muted-foreground">Attendance System</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Button
              key={to}
              variant={isActive(to) ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to={to} className="flex items-center gap-2">
                <Icon size={16} />
                {label}
              </Link>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Button
                key={to}
                variant={isActive(to) ? 'default' : 'ghost'}
                className="w-full justify-start"
                asChild
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to={to} className="flex items-center gap-2">
                  <Icon size={18} />
                  {label}
                </Link>
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignOut();
              }}
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
