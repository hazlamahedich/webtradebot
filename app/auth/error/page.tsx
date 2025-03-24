import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import ErrorClient from './error-client';

export default function AuthError() {
  return <ErrorClient />;
} 