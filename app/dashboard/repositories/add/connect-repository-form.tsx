'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addRepository } from "../actions";
import { useRouter } from "next/navigation";

export default function ConnectRepositoryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForceAddOption, setShowForceAddOption] = useState(false);
  const [repositoryName, setRepositoryName] = useState('');
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowForceAddOption(false);

    const repoName = formData.get('fullName') as string;
    setRepositoryName(repoName);

    try {
      const result = await addRepository(formData);
      
      if (result.success) {
        setSuccessMessage('Repository connected successfully! Redirecting to repositories page...');
        setTimeout(() => {
          router.push('/dashboard/repositories');
          router.refresh();
        }, 1500);
      } else {
        if (result.forceAddOption) {
          setShowForceAddOption(true);
          setErrorMessage(result.error || 'Repository appears to be already connected');
        } else {
          setErrorMessage(result.error || 'Failed to connect repository');
        }
      }
    } catch (error) {
      console.error('Error connecting repository:', error);
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  function handleForceAdd() {
    const formData = new FormData();
    formData.append('fullName', repositoryName);
    formData.append('forceAdd', 'true');
    handleSubmit(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Repository Name
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="fullName"
              name="fullName"
              placeholder="owner/repository"
              required
              disabled={isLoading || successMessage !== null}
              onChange={(e) => setRepositoryName(e.target.value)}
              value={repositoryName}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: username/repository or organization/repository
            </p>
          </div>
          <Button type="submit" disabled={isLoading || successMessage !== null}>
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </div>
      
      {errorMessage && (
        <div className="text-sm text-red-500 mt-2">
          {errorMessage}
        </div>
      )}
      
      {showForceAddOption && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800 mb-2">
            This repository appears to be already connected, but may have case sensitivity or formatting differences.
          </p>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleForceAdd}
            disabled={isLoading}
          >
            Connect Anyway
          </Button>
        </div>
      )}
      
      {successMessage && (
        <div className="text-sm text-green-500 mt-2">
          {successMessage}
        </div>
      )}
    </form>
  );
} 