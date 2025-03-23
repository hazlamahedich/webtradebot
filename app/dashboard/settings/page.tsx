"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState("profile");

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings.</p>
      </div>
      
      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your profile information and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john.doe@example.com" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  defaultValue="Full-stack developer with a passion for clean code and documentation."
                  rows={4}
                />
              </div>
              
              <Button className="mt-4">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how iDocument looks and feels.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Theme</h3>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="light" name="theme" value="light" />
                      <Label htmlFor="light">Light</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="dark" name="theme" value="dark" defaultChecked />
                      <Label htmlFor="dark">Dark</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="system" name="theme" value="system" />
                      <Label htmlFor="system">System</Label>
                    </div>
                  </div>
                </div>
                
                <Button className="mt-4">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="github" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Integration</CardTitle>
              <CardDescription>Configure your GitHub connection and access permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Connection Status</h3>
                    <p className="text-sm text-muted-foreground">Current status: Connected</p>
                  </div>
                  <Button variant="outline">
                    Reconnect
                  </Button>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="token">GitHub Access Token</Label>
                  <Input
                    id="token"
                    type="password"
                    value="ghp_••••••••••••••••••••••••••••"
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    To update your token, please reconnect your GitHub account.
                  </p>
                </div>
                
                <Button className="mt-4">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control how and when you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Email Digest Frequency</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="realtime" name="emailDigest" value="realtime" />
                    <Label htmlFor="realtime">Real-time (as they happen)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="daily" name="emailDigest" value="daily" defaultChecked />
                    <Label htmlFor="daily">Daily digest</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="weekly" name="emailDigest" value="weekly" />
                    <Label htmlFor="weekly">Weekly digest</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="never" name="emailDigest" value="never" />
                    <Label htmlFor="never">Never (web notifications only)</Label>
                  </div>
                </div>
                
                <Button className="mt-4">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 