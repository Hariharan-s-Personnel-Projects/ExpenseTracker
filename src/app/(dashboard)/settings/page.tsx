"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and budget configurations.</p>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Budget Preferences</CardTitle>
          <CardDescription>Set your global monthly budget limits for tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="monthly-limit">Monthly Limit (€)</Label>
              <Input id="monthly-limit" type="number" defaultValue="2000" />
            </div>
            
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
