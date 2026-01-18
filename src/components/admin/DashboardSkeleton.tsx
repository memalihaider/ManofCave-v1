'use client';

export function DashboardSkeleton() {
  const SkeletonBar = ({ width = 'w-full', height = 'h-4' }) => (
    <div className={`${width} ${height} bg-gray-200 rounded animate-pulse`} />
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Sidebar Skeleton */}
      <div className="hidden lg:flex w-64 bg-gray-900 flex-col">
        <div className="p-6">
          <SkeletonBar width="w-40" height="h-10" />
        </div>
        <div className="flex-1 space-y-4 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBar key={i} height="h-10" />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <SkeletonBar width="w-48" height="h-8" />
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 border border-gray-100">
                <SkeletonBar width="w-32" height="h-4" />
                <div className="mt-4 mb-2">
                  <SkeletonBar width="w-24" height="h-8" />
                </div>
                <SkeletonBar width="w-20" height="h-4" />
              </div>
            ))}
          </div>

          {/* Charts/Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-100">
              <SkeletonBar width="w-40" height="h-6" />
              <div className="space-y-4 mt-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonBar key={i} height="h-12" />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <SkeletonBar width="w-40" height="h-6" />
              <div className="space-y-4 mt-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBar key={i} height="h-12" />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <SkeletonBar width="w-40" height="h-6" />
              <div className="space-y-4 mt-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonBar key={i} height="h-12" />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <SkeletonBar width="w-40" height="h-6" />
              <div className="space-y-4 mt-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonBar key={i} height="h-12" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
