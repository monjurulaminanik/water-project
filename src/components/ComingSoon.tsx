import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            শীঘ্রই আসছে — পরবর্তী আপডেটে যুক্ত হবে।
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
