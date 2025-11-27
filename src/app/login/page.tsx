
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLaravelAuth } from '@/components/LaravelAuthContext';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

const Logo = () => (
  <svg
    width="39"
    height="39"
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


export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useLaravelAuth();
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('https://wattch-beta.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      // data should contain access_token. We also need user details.
      // The login response in AuthController returns token structure.
      // We might need to fetch profile after login or decode token if it has info.
      // Or we can assume we need to fetch profile.

      const token = data.access_token;

      // Fetch user profile
      const profileResponse = await fetch('https://wattch-beta.vercel.app/api/auth/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const user = await profileResponse.json();

      login(token, user);

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!isClient || authLoading || isAuthenticated) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 lg:justify-center">
      <div className="lg:mt-0">
        <div className="flex w-full flex-col items-center justify-center gap-8 lg:flex-row lg:gap-[103px]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex items-center justify-center gap-[9px] mt-[35px] lg:mt-0">
              <Logo />
              <h1 className="text-4xl font-bold tracking-tighter text-foreground leading-tight font-space">
                WATTch
              </h1>
            </div>
            <p className="text-base text-muted-foreground -mt-0.5 leading-tight">
              Control and monitor your <br />
              <span className="whitespace-nowrap">sockets anytime, anywhere.</span>
            </p>
          </div>

          <div className="flex w-full max-w-sm items-center justify-center shrink-0 mt-[30px] lg:mt-0">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                  Enter your email below to login to your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="password" placeholder="Password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center">
                  <Link href="/forgot-password" passHref>
                    <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                      Forgot password?
                    </span>
                  </Link>
                </div>

                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="underline">
                    Sign up
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
