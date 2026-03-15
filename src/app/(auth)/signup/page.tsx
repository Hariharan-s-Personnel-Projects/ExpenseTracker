"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Bot, Sparkles, TrendingUp, Wallet } from "lucide-react"
import { signup } from "@/actions/auth"
import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    
    // Basic password confirmation check inline
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setIsLoading(false)
      return
    }

    const res = await signup(formData)
    if (res?.error) {
      setError(res.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse">
      {/* Right Panel: Branding & Features (Hidden on mobile) */}
      <div className="hidden border-l border-border/50 md:flex flex-1 flex-col justify-between overflow-hidden bg-muted/5 relative p-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 blur-[100px] rounded-full pointer-events-none -translate-x-1/2 translate-y-1/3" />
        
        <div className="flex justify-end relative z-10 w-full">
           <Link href="/" className="flex items-center gap-2 group w-fit">
             <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors border border-primary/20">
               <Sparkles className="h-5 w-5 text-primary" />
             </div>
             <span className="font-bold text-xl tracking-tight">Tracker AI</span>
           </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-md mt-20 ml-auto mr-0">
          <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-bl from-foreground to-foreground/70">
            Start mastering your money today.
          </h2>
          <p className="text-muted-foreground text-lg">
            Sign up now and experience the power of AI-driven expense insights tailored just for you.
          </p>

          <div className="space-y-4 pt-8">
            <div className="flex items-center gap-3 text-sm text-foreground/80">
               <Bot className="h-5 w-5 text-primary" />
               <p>Interact with your intelligent financial AI</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/80">
               <Wallet className="h-5 w-5 text-primary" />
               <p>Weekly budget allocation tracking</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/80">
               <TrendingUp className="h-5 w-5 text-primary" />
               <p>Beautiful animated analytics</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground mt-8 text-right">
          © {new Date().getFullYear()} Tracker AI. All rights reserved.
        </div>
      </div>

      {/* Left Panel: Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden">
        {/* Mobile Logo */}
        <Link href="/" className="md:hidden absolute top-8 right-8 flex items-center gap-2 group">
          <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-colors border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Tracker AI</span>
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
            <p className="text-muted-foreground">Enter your email and a secure password.</p>
          </div>

          <form action={handleSubmit} className="space-y-6 mt-8">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  minLength={6}
                  className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  required 
                  minLength={6}
                  className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 h-11"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base shadow-md transition-transform active:scale-95" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground pt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
