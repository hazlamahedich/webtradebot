import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { addRepository } from "../actions";
import ConnectRepositoryForm from "./connect-repository-form";

export default async function AddRepositoryPage() {
  const session = await auth();
  
  if (!session?.user) {
    return redirect("/auth/signin");
  }
  
  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Link href="/dashboard/repositories" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to repositories
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Add GitHub Repository</CardTitle>
          <CardDescription>
            Connect a GitHub repository to enable AI-powered code reviews for pull requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md flex items-start gap-3">
              <GitHubLogoIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="font-medium">How it works</h3>
                <p className="text-sm text-muted-foreground">
                  When you connect a repository, we'll set up a webhook to automatically analyze new pull requests.
                  Our AI will review the code changes and provide suggestions to improve code quality.
                </p>
              </div>
            </div>
            
            <ConnectRepositoryForm />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start bg-muted/50 border-t">
          <p className="text-sm text-muted-foreground">
            You need to have admin access to the repository to connect it.
            For organization repositories, you may need to request access from an admin.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 