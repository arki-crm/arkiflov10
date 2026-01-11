import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  Loader2, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Wallet,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Shield,
  Zap,
  Calendar,
  Edit2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
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

const formatCompactCurrency = (amount) => {
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

const HEALTH_STATUS = {
  healthy: { color: 'bg-green-500', textColor: 'text-green-600', label: 'Healthy', icon: CheckCircle },
  caution: { color: 'bg-amber-500', textColor: 'text-amber-600', label: 'Caution', icon: AlertTriangle },
  critical: { color: 'bg-red-500', textColor: 'text-red-600', label: 'Critical', icon: AlertTriangle }
};

const PRESSURE_STATUS = {
  low: { color: 'bg-green-100 text-green-700', label: 'Low Pressure', icon: CheckCircle },
  moderate: { color: 'bg-amber-100 text-amber-700', label: 'Moderate Pressure', icon: Clock },
  high: { color: 'bg-red-100 text-red-700', label: 'High Pressure', icon: AlertTriangle }
};

const FinancialForecast = () => {
  const { hasPermission, user } = useAuth();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Assumptions dialog
  const [isAssumptionsDialogOpen, setIsAssumptionsDialogOpen] = useState(false);
  const [savingAssumptions, setSavingAssumptions] = useState(false);
  const [assumptions, setAssumptions] = useState({
    expected_monthly_income: 0,
    expected_project_closures: 0,
    average_project_value: 0,
    fixed_commitments: 0,
    notes: ''
  });

  const fetchForecast = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/finance/forecast`, { withCredentials: true });
      setForecast(response.data);
      
      // Initialize assumptions from response
      if (response.data.assumptions) {
        setAssumptions(response.data.assumptions);
      }
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
      toast.error('Failed to load financial forecast');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchForecast();
    setRefreshing(false);
    toast.success('Forecast data refreshed');
  };

  const handleSaveAssumptions = async () => {
    try {
      setSavingAssumptions(true);
      await axios.post(`${API}/finance/forecast/assumptions`, assumptions, { withCredentials: true });
      toast.success('Forecast assumptions updated');
      setIsAssumptionsDialogOpen(false);
      fetchForecast();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save assumptions');
    } finally {
      setSavingAssumptions(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-600">Unable to load financial forecast data</p>
            <Button onClick={fetchForecast} className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const runwayStatus = HEALTH_STATUS[forecast.runway?.status || 'healthy'];
  const RunwayIcon = runwayStatus.icon;
  const pressureStatus = PRESSURE_STATUS[forecast.sales_pressure?.level || 'low'];
  const PressureIcon = pressureStatus.icon;
  const netSurplus = forecast.net_burn_surplus >= 0;

  return (
    <div className="p-6 space-y-6" data-testid="forecast-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Forecast</h1>
          <p className="text-slate-500 text-sm mt-1">
            Health dashboard for {forecast.current_month}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          {hasPermission('finance.forecast.edit_assumptions') && (
            <Button onClick={() => setIsAssumptionsDialogOpen(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Assumptions
            </Button>
          )}
        </div>
      </div>

      {/* Health Score Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Health Score */}
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-2">Financial Health Score</p>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke={forecast.health_score >= 70 ? '#22c55e' : forecast.health_score >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="10"
                    strokeDasharray={`${forecast.health_score * 2.83} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold">{forecast.health_score}</span>
                </div>
              </div>
              <p className={cn("text-sm font-medium mt-2", 
                forecast.health_score >= 70 ? "text-green-400" : 
                forecast.health_score >= 40 ? "text-amber-400" : "text-red-400"
              )}>
                {forecast.health_score >= 70 ? 'Good Standing' : 
                 forecast.health_score >= 40 ? 'Needs Attention' : 'Critical'}
              </p>
            </div>

            {/* Runway */}
            <div className="text-center md:border-l md:border-slate-700 md:pl-6">
              <p className="text-slate-400 text-sm mb-2">Cash Runway</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <RunwayIcon className={cn("w-6 h-6", runwayStatus.textColor)} />
                <span className="text-4xl font-bold">{forecast.runway?.months || 0}</span>
                <span className="text-slate-400">months</span>
              </div>
              <Badge className={cn(runwayStatus.color, "text-white")}>
                {runwayStatus.label}
              </Badge>
              <p className="text-xs text-slate-400 mt-2">{forecast.runway?.message}</p>
            </div>

            {/* Net Burn/Surplus */}
            <div className="text-center md:border-l md:border-slate-700 md:pl-6">
              <p className="text-slate-400 text-sm mb-2">Net Monthly</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                {netSurplus ? (
                  <ArrowUpRight className="w-6 h-6 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-6 h-6 text-red-400" />
                )}
                <span className={cn("text-3xl font-bold", netSurplus ? "text-green-400" : "text-red-400")}>
                  {formatCompactCurrency(Math.abs(forecast.net_burn_surplus))}
                </span>
              </div>
              <Badge className={netSurplus ? "bg-green-500" : "bg-red-500"}>
                {netSurplus ? 'Surplus' : 'Burn'}
              </Badge>
            </div>

            {/* Sales Pressure */}
            <div className="text-center md:border-l md:border-slate-700 md:pl-6">
              <p className="text-slate-400 text-sm mb-2">Sales Pressure</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <PressureIcon className="w-6 h-6" />
                <span className="text-xl font-bold">{forecast.sales_pressure?.level?.toUpperCase()}</span>
              </div>
              <Badge className={pressureStatus.color}>
                {pressureStatus.label}
              </Badge>
              {forecast.sales_pressure?.additional_revenue_needed > 0 && (
                <p className="text-xs text-amber-400 mt-2">
                  Need {formatCurrency(forecast.sales_pressure.additional_revenue_needed)} more
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Income */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Monthly Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(forecast.monthly_income)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(forecast.monthly_expenses)}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Available */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Cash Available</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(forecast.cash_available)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Free Cash */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Free Cash</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(forecast.free_cash)}</p>
                <p className="text-xs text-slate-400">After commitments</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <PiggyBank className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commitments & Obligations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Commitments & Obligations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Locked Commitments</p>
                  <p className="text-xs text-slate-500">Approved expenses not yet paid</p>
                </div>
              </div>
              <span className="font-bold text-amber-600">{formatCurrency(forecast.locked_commitments)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Pending Requests</p>
                  <p className="text-xs text-slate-500">Awaiting approval</p>
                </div>
              </div>
              <span className="font-bold text-blue-600">{formatCurrency(forecast.pending_requests)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Fixed Expenses</p>
                  <p className="text-xs text-slate-500">Monthly recurring</p>
                </div>
              </div>
              <span className="font-bold text-purple-600">{formatCurrency(forecast.fixed_expenses)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded">
                  <Activity className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium">Variable Expenses</p>
                  <p className="text-xs text-slate-500">Monthly estimate</p>
                </div>
              </div>
              <span className="font-bold text-slate-600">{formatCurrency(forecast.variable_expenses)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(forecast.monthly_trends || {}).length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No trend data available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(forecast.monthly_trends).map(([month, data]) => {
                  const net = (data.income || 0) - (data.expenses || 0);
                  return (
                    <div key={month} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800">{month}</span>
                        <Badge className={net >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {net >= 0 ? '+' : ''}{formatCurrency(net)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-green-600">
                          <ArrowUpRight className="w-3 h-3" />
                          {formatCurrency(data.income)}
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <ArrowDownRight className="w-3 h-3" />
                          {formatCurrency(data.expenses)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Questions Answered */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Key Questions Answered</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-slate-500 mb-1">Can we survive 3 months if sales slow down?</p>
              <p className={cn("font-bold text-lg", forecast.runway?.months >= 3 ? "text-green-600" : "text-red-600")}>
                {forecast.runway?.months >= 3 ? '✓ Yes' : '✗ No'} - {forecast.runway?.months?.toFixed(1)} months runway
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-slate-500 mb-1">Do we need to push sales aggressively?</p>
              <p className={cn("font-bold text-lg", 
                forecast.sales_pressure?.level === 'high' ? "text-red-600" : 
                forecast.sales_pressure?.level === 'moderate' ? "text-amber-600" : "text-green-600"
              )}>
                {forecast.sales_pressure?.level === 'high' ? '⚠ Yes - Critical' : 
                 forecast.sales_pressure?.level === 'moderate' ? '⚡ Moderate push needed' : 
                 '✓ No - On track'}
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-slate-500 mb-1">How much can we safely spend this month?</p>
              <p className="font-bold text-lg text-blue-600">
                {formatCurrency(forecast.free_cash)} available
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-slate-500 mb-1">Are we making or losing money?</p>
              <p className={cn("font-bold text-lg", netSurplus ? "text-green-600" : "text-red-600")}>
                {netSurplus ? `✓ Surplus of ${formatCurrency(forecast.net_burn_surplus)}` : 
                 `✗ Burning ${formatCurrency(Math.abs(forecast.net_burn_surplus))}/month`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions Dialog */}
      <Dialog open={isAssumptionsDialogOpen} onOpenChange={setIsAssumptionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Forecast Assumptions</DialogTitle>
            <DialogDescription>
              Adjust the parameters used for financial forecasting.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Expected Monthly Income (₹)</Label>
              <Input
                type="number"
                value={assumptions.expected_monthly_income}
                onChange={(e) => setAssumptions(p => ({ ...p, expected_monthly_income: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expected Project Closures</Label>
                <Input
                  type="number"
                  value={assumptions.expected_project_closures}
                  onChange={(e) => setAssumptions(p => ({ ...p, expected_project_closures: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Avg Project Value (₹)</Label>
                <Input
                  type="number"
                  value={assumptions.average_project_value}
                  onChange={(e) => setAssumptions(p => ({ ...p, average_project_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Fixed Monthly Commitments (₹)</Label>
              <Input
                type="number"
                value={assumptions.fixed_commitments}
                onChange={(e) => setAssumptions(p => ({ ...p, fixed_commitments: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Any notes about these assumptions..."
                value={assumptions.notes || ''}
                onChange={(e) => setAssumptions(p => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssumptionsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAssumptions} disabled={savingAssumptions}>
              {savingAssumptions ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Assumptions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialForecast;
