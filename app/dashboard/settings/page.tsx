"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AppearanceSettings } from "./components/appearance-settings";
import { GithubSettings } from "./components/github-settings";
import { NotificationSettings } from "./components/notification-settings";
import { LLMSettings } from "./components/llm-settings";
import { LLMUsage } from "./components/llm-usage";

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState("profile");

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="llm">LLM Settings</TabsTrigger>
            <TabsTrigger value="llm-usage">LLM Usage</TabsTrigger>
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
            <AppearanceSettings />
          </TabsContent>
          
          <TabsContent value="github" className="mt-6">
            <GithubSettings />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="llm" className="mt-6">
            <LLMSettings />
          </TabsContent>
          
          <TabsContent value="llm-usage" className="mt-6">
            <LLMUsage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 