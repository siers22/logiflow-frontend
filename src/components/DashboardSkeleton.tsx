import { Skeleton } from "@/components/ui/skeleton";

/** Скелетон, имитирующий DashboardLayout + типичный контент дашборда */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-3" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="w-9 h-9 rounded-md" />
              <Skeleton className="w-9 h-9 rounded-md" />
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="hidden md:block space-y-1">
                  <Skeleton className="w-28 h-4" />
                  <Skeleton className="w-36 h-3" />
                </div>
              </div>
              <Skeleton className="w-20 h-9 rounded-md" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page title */}
          <div className="space-y-2">
            <Skeleton className="w-48 h-7" />
            <Skeleton className="w-72 h-4" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-8 h-8 rounded-md" />
                </div>
                <Skeleton className="w-16 h-8" />
                <Skeleton className="w-32 h-3" />
              </div>
            ))}
          </div>

          {/* Content card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="w-36 h-5" />
              <Skeleton className="w-24 h-9 rounded-md" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-3" />
                  </div>
                  <Skeleton className="w-20 h-6 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
