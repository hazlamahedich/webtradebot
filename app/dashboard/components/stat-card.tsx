import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  href?: string;
}

export function StatCard({ title, value, description, href }: StatCardProps) {
  const content = (
    <Card className={href ? "hover:bg-accent/10 transition-colors" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
  
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  
  return content;
} 