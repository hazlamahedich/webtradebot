export default function SettingsLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2"></div>
      </div>
      
      <div className="grid w-full md:w-[400px] grid-cols-4 gap-1 bg-slate-200 dark:bg-slate-700 rounded-md p-1 animate-pulse">
        <div className="h-8 rounded"></div>
        <div className="h-8 rounded"></div>
        <div className="h-8 rounded"></div>
        <div className="h-8 rounded"></div>
      </div>
      
      <div className="mt-6">
        <div className="bg-white dark:bg-slate-800 rounded-md border p-6 shadow-sm">
          <div className="mb-4">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2"></div>
          </div>
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 