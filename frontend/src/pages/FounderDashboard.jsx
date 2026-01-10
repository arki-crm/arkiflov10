import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Loader2, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Lock,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const FounderDashboard = () => {
  const { hasPermission, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/finance/founder-dashboard`, {
        withCredentials: true
      });
      setData(res.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch founder dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Check permission
  if (!hasPermission('finance.founder_dashboard') && user?.role !== 'Admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <ShieldX className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">This dashboard is restricted to Founders and Admins.</p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Failed to load dashboard</p>
      </div>
    );
  }

  const healthColors = {
    healthy: { bg: 'bg-green-500', text: 'text-green-400', icon: ShieldCheck },
    warning: { bg: 'bg-amber-500', text: 'text-amber-400', icon: ShieldAlert },
    critical: { bg: 'bg-red-500', text: 'text-red-400', icon: ShieldX }
  };

  const HealthIcon = healthColors[data.health]?.icon || ShieldCheck;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6" data-testid="founder-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Financial Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Can I safely spend money today?
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status Banner */}
      <Card className={cn(
        "mb-8 border-0",
        data.health === 'healthy' && "bg-gradient-to-r from-green-900/50 to-green-800/30",
        data.health === 'warning' && "bg-gradient-to-r from-amber-900/50 to-amber-800/30",
        data.health === 'critical' && "bg-gradient-to-r from-red-900/50 to-red-800/30"
      )}>
        <CardContent className="p-6 flex items-center gap-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            healthColors[data.health]?.bg
          )}>
            <HealthIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className={cn("text-2xl font-bold capitalize", healthColors[data.health]?.text)}>
              {data.health}
            </h2>
            <p className="text-slate-300">{data.health_message}</p>
          </div>
        </CardContent>
      </Card>

      {/* Main Numbers - The Answer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Cash Available */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Total Cash Available</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(data.total_cash_available)}
            </p>
            <div className="mt-4 space-y-2">
              {data.account_balances?.map((acc, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-400">{acc.account_name}</span>
                  <span className="text-slate-300">{formatCurrency(acc.balance)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Locked Commitments */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-slate-400 text-sm">Locked Commitments</span>
            </div>
            <p className="text-3xl font-bold text-amber-400">
              {formatCurrency(data.total_locked_commitments)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Total planned vendor costs across all projects
            </p>
          </CardContent>
        </Card>

        {/* Safe Surplus - THE ANSWER */}
        <Card className={cn(
          "border-2",
          data.safe_surplus >= 0 
            ? "bg-green-900/30 border-green-600" 
            : "bg-red-900/30 border-red-600"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                data.safe_surplus >= 0 ? "bg-green-500/20" : "bg-red-500/20"
              )}>
                {data.safe_surplus >= 0 
                  ? <TrendingUp className="w-5 h-5 text-green-400" />
                  : <TrendingDown className="w-5 h-5 text-red-400" />
                }
              </div>
              <span className="text-slate-400 text-sm">Safe Surplus</span>
            </div>
            <p className={cn(
              "text-4xl font-bold",
              data.safe_surplus >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {formatCurrency(data.safe_surplus)}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              {data.safe_surplus >= 0 
                ? "Amount you can safely use" 
                : "You're over-committed"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Month to Date */}
      <Card className="bg-slate-800/50 border-slate-700 mb-8">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-lg text-white">
            Month to Date — {data.month_to_date?.month}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-green-400 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Received
              </p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(data.month_to_date?.received)}
              </p>
            </div>
            <div>
              <p className="text-xs text-red-400 mb-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Spent
              </p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(data.month_to_date?.spent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Net</p>
              <p className={cn(
                "text-2xl font-bold",
                data.month_to_date?.net >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {data.month_to_date?.net >= 0 ? '+' : ''}{formatCurrency(data.month_to_date?.net)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risky Projects */}
      {data.risky_projects?.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Projects Requiring Attention ({data.risky_project_count})
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/finance/project-finance')}
                className="text-blue-400 hover:text-blue-300"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700">
              {data.risky_projects.map((project) => (
                <div 
                  key={project.project_id}
                  className="p-4 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/finance/project-finance/${project.project_id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                          {project.pid}
                        </span>
                        <Badge 
                          variant={project.risk_level === 'red' ? 'destructive' : 'outline'}
                          className={cn(
                            "text-xs",
                            project.risk_level === 'amber' && "border-amber-500 text-amber-400"
                          )}
                        >
                          {project.risk_level === 'red' ? 'At Risk' : 'Tight'}
                        </Badge>
                        {project.is_over_budget && (
                          <Badge variant="destructive" className="text-xs">
                            Over Budget
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-white">{project.project_name}</p>
                      <p className="text-sm text-slate-400">{project.client_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Surplus</p>
                      <p className={cn(
                        "text-lg font-bold",
                        project.surplus >= 0 ? "text-slate-300" : "text-red-400"
                      )}>
                        {formatCurrency(project.surplus)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Risky Projects */}
      {data.risky_projects?.length === 0 && (
        <Card className="bg-green-900/20 border-green-800">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-green-400 font-medium">All projects are financially healthy</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FounderDashboard;
