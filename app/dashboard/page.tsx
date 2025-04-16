import DashboardLayout from '@/components/dashboard-layout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Campaign Stats Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Campaigns</h3>
            <div className="text-3xl font-bold">--</div>
            <p className="text-sm text-muted-foreground">Active campaigns</p>
          </div>
          
          {/* Impressions Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Impressions</h3>
            <div className="text-3xl font-bold">--</div>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </div>
          
          {/* Clicks Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Clicks</h3>
            <div className="text-3xl font-bold">--</div>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </div>
        </div>
        
        <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
          <p className="text-muted-foreground">No recent activity to display</p>
        </div>
      </div>
    </DashboardLayout>
  );
} 