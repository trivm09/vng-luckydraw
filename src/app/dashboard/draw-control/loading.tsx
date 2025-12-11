import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DrawControlLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-7 w-12 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Control Panel */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
              <div className="h-10 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="h-11 w-36 bg-muted rounded animate-pulse" />
              <div className="h-11 w-24 bg-muted rounded animate-pulse" />
              <div className="h-11 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>

          <div className="h-px bg-muted" />

          {/* Prize Selection */}
          <div className="space-y-3">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-28 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winners List */}
      <Card>
        <CardHeader>
          <div className="h-6 w-52 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="h-12 w-12 mx-auto mb-3 bg-muted rounded animate-pulse" />
            <div className="h-4 w-40 mx-auto bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
