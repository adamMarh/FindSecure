import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Package, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface Stats {
  totalInquiries: number;
  pendingReview: number;
  matched: number;
  resolved: number;
  totalInventory: number;
}

export default function Overview() {
  const [stats, setStats] = useState<Stats>({
    totalInquiries: 0,
    pendingReview: 0,
    matched: 0,
    resolved: 0,
    totalInventory: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch inquiry counts
      const { data: inquiries } = await supabase
        .from('inquiries')
        .select('status');

      const inquiryStats = (inquiries || []).reduce(
        (acc, curr) => {
          acc.total++;
          if (curr.status === 'submitted' || curr.status === 'under_review') {
            acc.pending++;
          } else if (curr.status === 'matched') {
            acc.matched++;
          } else if (curr.status === 'resolved') {
            acc.resolved++;
          }
          return acc;
        },
        { total: 0, pending: 0, matched: 0, resolved: 0 }
      );

      // Fetch inventory count
      const { count: inventoryCount } = await supabase
        .from('lost_items')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalInquiries: inquiryStats.total,
        pendingReview: inquiryStats.pending,
        matched: inquiryStats.matched,
        resolved: inquiryStats.resolved,
        totalInventory: inventoryCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Inquiries',
      value: stats.totalInquiries,
      icon: Search,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Matches Found',
      value: stats.matched,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Items in Inventory',
      value: stats.totalInventory,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Monitor inquiries and manage the lost items inventory
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">
                {loading ? '-' : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed coming soon...
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Review pending inquiries in the Inquiries tab
            </p>
            <p className="text-sm text-muted-foreground">
              • Add new items to inventory in the Inventory tab
            </p>
            <p className="text-sm text-muted-foreground">
              • Process matches and verify ownership
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
