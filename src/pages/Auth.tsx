import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import SchoolLogo from '@/components/attendance/SchoolLogo';
import { Loader2, GraduationCap, Users } from 'lucide-react';
import type { AppRole } from '@/integrations/supabase/client';

const Auth = () => {
  const navigate = useNavigate();
  const { user, role, signUp, signIn, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('student');
  const [studentId, setStudentId] = useState('');
  const [grade, setGrade] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user && role) {
      if (role === 'teacher') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerConfirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are the same.',
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
      });
      return;
    }

    if (selectedRole === 'student' && !studentId) {
      toast({
        variant: 'destructive',
        title: 'Student ID required',
        description: 'Please enter your student ID.',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(registerEmail, registerPassword, {
      full_name: fullName,
      role: selectedRole,
      student_id: selectedRole === 'student' ? studentId : undefined,
      grade: selectedRole === 'student' ? grade : undefined,
    });

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Please login instead.';
      }
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: errorMessage,
      });
    } else {
      toast({
        title: 'Registration successful!',
        description: 'Please check your email to verify your account, or login if email confirmation is disabled.',
      });
      setActiveTab('login');
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <SchoolLogo size="large" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Rural School Attendance
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to access the attendance system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">I am a</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={16} />
                        Student
                      </div>
                    </SelectItem>
                    <SelectItem value="teacher">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        Teacher / Faculty
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {selectedRole === 'student' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input
                      id="student-id"
                      placeholder="e.g., STU001"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade / Class</Label>
                    <Input
                      id="grade"
                      placeholder="e.g., 10A"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
