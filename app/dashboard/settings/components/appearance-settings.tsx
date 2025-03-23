"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

export function AppearanceSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [theme, setTheme] = useState("system");
  const [preferences, setPreferences] = useState({
    animations: true,
    codeHighlighting: true
  });

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  const handleToggle = (name: keyof typeof preferences) => {
    setPreferences(prev => ({
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
      
      // In a real implementation, we would update the theme in localStorage or a context provider
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
      }
      
      toast({
        title: "Appearance updated",
        description: "Your appearance settings have been updated successfully.",
        status: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your appearance settings.",
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
          <h3 className="text-lg font-medium mb-4">Theme</h3>
          <RadioGroup value={theme} onValueChange={handleThemeChange} className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark">Dark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system">System</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="animations">Animations</Label>
                <p className="text-sm text-muted-foreground">Enable UI animations</p>
              </div>
              <Switch
                id="animations"
                checked={preferences.animations}
                onCheckedChange={() => handleToggle("animations")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="codeHighlighting">Code Highlighting</Label>
                <p className="text-sm text-muted-foreground">Enable syntax highlighting in code blocks</p>
              </div>
              <Switch
                id="codeHighlighting"
                checked={preferences.codeHighlighting}
                onCheckedChange={() => handleToggle("codeHighlighting")}
              />
            </div>
          </div>
        </div>
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
} 