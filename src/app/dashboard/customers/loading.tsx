import { Card, CardContent } from "@/components/ui/card";

export default function CustomersLoading() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      </div>

      {/* Toolbar skeleton */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="h-10 flex-1 min-w-[200px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-[180px] bg-muted rounded animate-pulse" />
            <div className="h-10 w-36 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="flex gap-4 pb-2 border-b">
            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="h-6 w-24 bg-muted rounded animate-pulse" />
              <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              <div className="h-6 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t">
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
        </div>
      </Card>
    </div>
  );
}
