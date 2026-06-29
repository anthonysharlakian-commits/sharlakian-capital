"use client";

import { useState, useTransition } from "react";
import { signIn, signUp, signInWithMagicLink } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSignIn(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) setError(result.error);
    });
  }

  function handleSignUp(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) setError(result.error);
    });
  }

  function handleMagicLink(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await signInWithMagicLink(formData);
      if (result?.error) setError(result.error);
      if (result?.success) setMessage(result.message ?? "Check your email.");
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-2">
            <span className="text-primary-foreground font-bold">SH</span>
          </div>
          <CardTitle>Sharlakian Holdings OS</CardTitle>
          <CardDescription>Sign in to your investment command center</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="magic">Magic Link</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form action={handleSignIn} className="space-y-4 mt-4">
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password" required />
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form action={handleSignUp} className="space-y-4 mt-4">
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password (min 6 chars)" minLength={6} required />
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="magic">
              <form action={handleMagicLink} className="space-y-4 mt-4">
                <Input name="email" type="email" placeholder="Email" required />
                <Button type="submit" variant="outline" className="w-full" disabled={pending}>
                  {pending ? "Sending..." : "Send Magic Link"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && <p className="text-sm text-score-low mt-4 text-center">{error}</p>}
          {message && <p className="text-sm text-score-high mt-4 text-center">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
