"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

export function GithubSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    token: "ghp_•••••••••••••••••••••••••••••••",
    connectionStatus: "Connected",
    autoSync: true
  });

  const [permissions, setPermissions] = useState({
    readRepos: true,
    writeRepos: false,
    readOrgs: true,
    adminWebhooks: true
  });

  const handlePermissionToggle = (name: keyof typeof permissions) => {
    setPermissions(prev => ({
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
        title: "GitHub settings updated",
        description: "Your GitHub integration settings have been updated successfully.",
        status: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your GitHub settings.",
        status: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reconnectGithub = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "GitHub reconnected",
        description: "Your GitHub account has been reconnected successfully.",
        status: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem reconnecting to GitHub.",
        status: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Connection Status</h3>
            <p className="text-sm text-muted-foreground">Current status: {formData.connectionStatus}</p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={reconnectGithub} 
            disabled={isLoading}
          >
            Reconnect
          </Button>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="token">GitHub Access Token</Label>
          <Input
            id="token"
            name="token"
            type="password"
            value={formData.token}
            disabled
          />
          <p className="text-sm text-muted-foreground">
            To update your token, please reconnect your GitHub account.
          </p>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Permissions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="readRepos">Read Repositories</Label>
                <p className="text-sm text-muted-foreground">View your repositories and their contents</p>
              </div>
              <Switch
                id="readRepos"
                checked={permissions.readRepos}
                disabled
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="writeRepos">Write to Repositories</Label>
                <p className="text-sm text-muted-foreground">Push changes to repositories</p>
              </div>
              <Switch
                id="writeRepos"
                checked={permissions.writeRepos}
                onCheckedChange={() => handlePermissionToggle("writeRepos")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="readOrgs">Read Organizations</Label>
                <p className="text-sm text-muted-foreground">View your organization memberships</p>
              </div>
              <Switch
                id="readOrgs"
                checked={permissions.readOrgs}
                onCheckedChange={() => handlePermissionToggle("readOrgs")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="adminWebhooks">Manage Webhooks</Label>
                <p className="text-sm text-muted-foreground">Create and manage repository webhooks</p>
              </div>
              <Switch
                id="adminWebhooks"
                checked={permissions.adminWebhooks}
                onCheckedChange={() => handlePermissionToggle("adminWebhooks")}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-6">
          <Switch
            id="autoSync"
            checked={formData.autoSync}
            onCheckedChange={() => setFormData(prev => ({ ...prev, autoSync: !prev.autoSync }))}
          />
          <div>
            <Label htmlFor="autoSync">Auto-sync repositories</Label>
            <p className="text-sm text-muted-foreground">
              Automatically keep your repository list up to date
            </p>
          </div>
        </div>
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
} 