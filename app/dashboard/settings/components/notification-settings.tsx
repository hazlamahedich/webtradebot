"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [emailDigest, setEmailDigest] = useState("daily");
  const [notifications, setNotifications] = useState({
    newComments: true,
    mentionsAndReplies: true,
    repositoryUpdates: true,
    teamAnnouncements: false,
    productUpdates: true
  });

  const handleNotificationToggle = (name: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been updated successfully.",
        status: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your notification settings.",
        status: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="newComments">New Comments</Label>
                <p className="text-sm text-muted-foreground">Notify when someone comments on your code</p>
              </div>
              <Switch
                id="newComments"
                checked={notifications.newComments}
                onCheckedChange={() => handleNotificationToggle("newComments")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mentionsAndReplies">Mentions & Replies</Label>
                <p className="text-sm text-muted-foreground">Notify when you're mentioned or someone replies to you</p>
              </div>
              <Switch
                id="mentionsAndReplies"
                checked={notifications.mentionsAndReplies}
                onCheckedChange={() => handleNotificationToggle("mentionsAndReplies")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="repositoryUpdates">Repository Updates</Label>
                <p className="text-sm text-muted-foreground">Notify about new pull requests and issues</p>
              </div>
              <Switch
                id="repositoryUpdates"
                checked={notifications.repositoryUpdates}
                onCheckedChange={() => handleNotificationToggle("repositoryUpdates")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="teamAnnouncements">Team Announcements</Label>
                <p className="text-sm text-muted-foreground">Notify about team announcements and updates</p>
              </div>
              <Switch
                id="teamAnnouncements"
                checked={notifications.teamAnnouncements}
                onCheckedChange={() => handleNotificationToggle("teamAnnouncements")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="productUpdates">Product Updates</Label>
                <p className="text-sm text-muted-foreground">Notify about new features and improvements</p>
              </div>
              <Switch
                id="productUpdates"
                checked={notifications.productUpdates}
                onCheckedChange={() => handleNotificationToggle("productUpdates")}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Email Digest Frequency</h3>
          <RadioGroup value={emailDigest} onValueChange={setEmailDigest} className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="realtime" id="realtime" />
              <Label htmlFor="realtime">Real-time (as they happen)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily">Daily digest</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly">Weekly digest</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="never" id="never" />
              <Label htmlFor="never">Never (web notifications only)</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
} 