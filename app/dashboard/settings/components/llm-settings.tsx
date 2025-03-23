"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import { PlusCircle, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";

interface LLMConfig {
  id: string;
  provider: string;
  modelName: string;
  displayName: string;
  apiKey?: string;
  apiUrl?: string;
  costPerInputToken: string;
  costPerOutputToken: string;
  isActive: boolean;
  isDefault: boolean;
  contextWindow?: number;
}

const providers = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "google", label: "Google (Gemini)" },
  { value: "mistral", label: "Mistral AI" },
  { value: "groq", label: "Groq" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "together", label: "Together AI" },
  { value: "custom", label: "Custom" },
];

export function LLMSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<LLMConfig[]>([]);
  const [editingModel, setEditingModel] = useState<LLMConfig | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formAction, setFormAction] = useState<"add" | "edit">("add");
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Form
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<LLMConfig>({
    defaultValues: {
      provider: "openai",
      modelName: "",
      displayName: "",
      apiKey: "",
      apiUrl: "",
      costPerInputToken: "0",
      costPerOutputToken: "0",
      isActive: true,
      isDefault: false,
      contextWindow: 8192
    }
  });
  
  const selectedProvider = watch("provider");
  
  // Fetch models on load
  useEffect(() => {
    async function loadModels() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/llm/configurations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch LLM configurations');
        }
        
        const data = await response.json();
        setModels(data);
      } catch (error) {
        console.error('Error loading LLM models:', error);
        setAlertMessage({
          type: 'error',
          message: 'Failed to load LLM configurations'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadModels();
  }, []);
  
  // Edit model
  const handleEditModel = (model: LLMConfig) => {
    setEditingModel(model);
    reset(model);
    setFormAction("edit");
    setShowForm(true);
  };
  
  // Add new model
  const handleAddModel = () => {
    reset({
      id: '',
      provider: "openai",
      modelName: "",
      displayName: "",
      apiKey: "",
      apiUrl: "",
      costPerInputToken: "0",
      costPerOutputToken: "0",
      isActive: true,
      isDefault: false,
      contextWindow: 8192
    });
    setFormAction("add");
    setShowForm(true);
  };
  
  // Delete model
  const handleDeleteModel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model configuration?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/llm/configurations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete model configuration');
      }
      
      // Remove from list
      setModels(models.filter(model => model.id !== id));
      setAlertMessage({
        type: 'success',
        message: 'Model configuration deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      setAlertMessage({
        type: 'error',
        message: 'Failed to delete model configuration'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set as default model
  const handleSetDefault = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/llm/configurations/${id}/default`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to set default model');
      }
      
      // Update list
      setModels(models.map(model => ({
        ...model,
        isDefault: model.id === id
      })));
      
      setAlertMessage({
        type: 'success',
        message: 'Default model updated successfully'
      });
    } catch (error) {
      console.error('Error setting default model:', error);
      setAlertMessage({
        type: 'error',
        message: 'Failed to set default model'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle model active state
  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/llm/configurations/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentState })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle model state');
      }
      
      // Update list
      setModels(models.map(model => 
        model.id === id ? { ...model, isActive: !currentState } : model
      ));
    } catch (error) {
      console.error('Error toggling model state:', error);
      setAlertMessage({
        type: 'error',
        message: 'Failed to toggle model state'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit form
  const onSubmit = async (data: LLMConfig) => {
    try {
      setIsLoading(true);
      
      // Format numbers
      data.costPerInputToken = parseFloat(data.costPerInputToken).toString();
      data.costPerOutputToken = parseFloat(data.costPerOutputToken).toString();
      
      const isEdit = formAction === "edit";
      const url = isEdit 
        ? `/api/llm/configurations/${data.id}` 
        : '/api/llm/configurations';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} model configuration`);
      }
      
      const savedModel = await response.json();
      
      if (isEdit) {
        // Update in list
        setModels(models.map(model => 
          model.id === savedModel.id ? savedModel : model
        ));
      } else {
        // Add to list
        setModels([...models, savedModel]);
      }
      
      setAlertMessage({
        type: 'success',
        message: `Model configuration ${isEdit ? 'updated' : 'created'} successfully`
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving model:', error);
      setAlertMessage({
        type: 'error',
        message: `Failed to ${formAction === "edit" ? 'update' : 'create'} model configuration`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get placeholder for API key
  const getApiKeyPlaceholder = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'sk-...';
      case 'anthropic':
        return 'sk-ant-...';
      case 'google':
        return 'AIza...';
      case 'mistral':
        return 'MISTRAL_API_KEY';
      default:
        return 'API Key';
    }
  };
  
  // Get API URL placeholder
  const getApiUrlPlaceholder = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com';
      case 'mistral':
        return 'https://api.mistral.ai/v1';
      case 'groq':
        return 'https://api.groq.com/openai/v1';
      default:
        return 'API URL (optional)';
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">LLM Configurations</h2>
          <p className="text-sm text-muted-foreground">
            Manage language models from various providers
          </p>
        </div>
        <Button onClick={handleAddModel}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Model
        </Button>
      </div>
      
      {alertMessage && (
        <Alert className={`mb-4 ${alertMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertTitle>{alertMessage.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}
      
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{formAction === "add" ? "Add New Model" : "Edit Model"}</CardTitle>
            <CardDescription>
              Configure a language model for use in the application
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select 
                    defaultValue={watch("provider")}
                    onValueChange={(value) => setValue("provider", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input
                    id="modelName"
                    placeholder="e.g., gpt-4o, claude-3-opus"
                    {...register("modelName", { required: true })}
                  />
                  {errors.modelName && (
                    <p className="text-sm text-red-500">Model name is required</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="e.g., GPT-4o, Claude 3 Opus"
                  {...register("displayName", { required: true })}
                />
                {errors.displayName && (
                  <p className="text-sm text-red-500">Display name is required</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={getApiKeyPlaceholder(selectedProvider)}
                    {...register("apiKey")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL (Optional)</Label>
                  <Input
                    id="apiUrl"
                    placeholder={getApiUrlPlaceholder(selectedProvider)}
                    {...register("apiUrl")}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPerInputToken">Cost Per Input Token ($)</Label>
                  <Input
                    id="costPerInputToken"
                    type="number"
                    step="0.0000001"
                    placeholder="0.00001"
                    {...register("costPerInputToken")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="costPerOutputToken">Cost Per Output Token ($)</Label>
                  <Input
                    id="costPerOutputToken"
                    type="number"
                    step="0.0000001"
                    placeholder="0.00003"
                    {...register("costPerOutputToken")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contextWindow">Context Window (tokens)</Label>
                  <Input
                    id="contextWindow"
                    type="number"
                    placeholder="8192"
                    {...register("contextWindow", { valueAsNumber: true })}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={watch("isActive")}
                    onCheckedChange={(checked) => setValue("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={watch("isDefault")}
                    onCheckedChange={(checked) => setValue("isDefault", checked)}
                  />
                  <Label htmlFor="isDefault">Default Model</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Model"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
      
      {/* Models List */}
      <div className="space-y-4">
        {models.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No model configurations found</p>
              <Button 
                variant="link" 
                onClick={handleAddModel} 
                className="mt-2"
              >
                Add your first model
              </Button>
            </CardContent>
          </Card>
        ) : (
          models.map((model) => (
            <Card key={model.id} className={!model.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">
                      {model.displayName}
                      {model.isDefault && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {providers.find(p => p.value === model.provider)?.label} - {model.modelName}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleToggleActive(model.id, model.isActive)}
                    >
                      {model.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditModel(model)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!model.isDefault && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSetDefault(model.id)}
                        >
                          <span className="sr-only">Set as default</span>
                          Set Default
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteModel(model.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Input Cost:</span>{" "}
                    ${parseFloat(model.costPerInputToken).toFixed(7)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output Cost:</span>{" "}
                    ${parseFloat(model.costPerOutputToken).toFixed(7)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Context:</span>{" "}
                    {model.contextWindow?.toLocaleString() || "N/A"} tokens
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 