import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Loader2,
  Crown,
  Users,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Clock,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CEODashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/ceo/dashboard`, {
        withCredentials: true
      });
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch CEO dashboard:', err);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const projectHealth = data?.project_health || {};
  const bottleneck = data?.bottleneck_analysis || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Crown className="w-7 h-7 text-amber-500" />
            CEO Dashboard
          </h1>
          <p className="text-sm text-slate-500">Private performance overview</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Project Health Overview */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600" />
                Project Health
              </h3>
              <p className="text-sm text-slate-500 mt-1">Overall design workflow health</p>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-4xl font-bold",
                projectHealth.health_percentage >= 80 ? 'text-emerald-600' :
                projectHealth.health_percentage >= 60 ? 'text-amber-600' : 'text-red-600'
              )}>
                {projectHealth.health_percentage || 0}%
              </p>
              <p className="text-xs text-slate-500">Health Score</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{projectHealth.total || 0}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{projectHealth.active || 0}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{projectHealth.completed || 0}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{projectHealth.with_delays || 0}</p>
              <p className="text-xs text-slate-500">With Delays</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Designer Performance */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Designer Performance Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.designer_performance?.length > 0 ? (
            <div className="space-y-3">
              {data.designer_performance.map((designer, index) => (
                <div 
                  key={designer.user_id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border",
                    index === 0 && "bg-amber-50 border-amber-200"
                  )}
                >
                  {/* Rank */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    index === 0 ? "bg-amber-500 text-white" :
                    index === 1 ? "bg-slate-400 text-white" :
                    index === 2 ? "bg-amber-700 text-white" :
                    "bg-slate-200 text-slate-600"
                  )}>
                    {index + 1}
                  </div>
                  
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {designer.picture ? (
                        <img src={designer.picture} alt={designer.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getInitials(designer.name)
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{designer.name}</p>
                      <p className="text-xs text-slate-500">{designer.role}</p>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">{designer.completed_projects}</p>
                      <p className="text-xs text-slate-400">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">{designer.active_projects}</p>
                      <p className="text-xs text-slate-400">Active</p>
                    </div>
                    <div className="text-center">
                      <p className={cn(
                        "text-sm font-medium",
                        designer.on_time_rate >= 90 ? "text-emerald-600" :
                        designer.on_time_rate >= 70 ? "text-amber-600" : "text-red-600"
                      )}>
                        {designer.on_time_rate}%
                      </p>
                      <p className="text-xs text-slate-400">On-Time</p>
                    </div>
                    {designer.overdue_tasks > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {designer.overdue_tasks} overdue
                      </Badge>
                    )}
                  </div>
                  
                  {/* Score */}
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg",
                    getScoreBg(designer.score),
                    getScoreColor(designer.score)
                  )}>
                    {designer.score}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No designer data available</p>
          )}
        </CardContent>
      </Card>

      {/* Manager & Validation Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Design Manager Performance */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Design Manager (Arya)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.manager_performance?.length > 0 ? (
              <div className="space-y-3">
                {data.manager_performance.map((manager) => (
                  <div key={manager.user_id} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {getInitials(manager.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{manager.name}</p>
                          <p className="text-xs text-slate-500">Design Manager</p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold",
                        getScoreBg(manager.score),
                        getScoreColor(manager.score)
                      )}>
                        {manager.score}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-lg font-bold text-slate-800">{manager.total_projects_managed}</p>
                        <p className="text-xs text-slate-500">Projects Managed</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-lg font-bold text-red-600">{manager.delayed_projects}</p>
                        <p className="text-xs text-slate-500">Delayed</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No manager data</p>
            )}
          </CardContent>
        </Card>

        {/* Validation Speed (Sharon) */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              Validation Speed (Sharon)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.validation_performance?.length > 0 ? (
              <div className="space-y-3">
                {data.validation_performance.map((pm) => (
                  <div key={pm.user_id} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                          {getInitials(pm.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{pm.name}</p>
                          <p className="text-xs text-slate-500">Production Manager</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600">
                        {pm.approval_rate}% Approval
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-lg font-bold text-slate-800">{pm.total_validations}</p>
                        <p className="text-xs text-slate-500">Total</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-lg font-bold text-emerald-600">{pm.approved}</p>
                        <p className="text-xs text-slate-500">Approved</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-lg font-bold text-amber-600">{pm.needs_revision}</p>
                        <p className="text-xs text-slate-500">Revisions</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No validation data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delay Attribution & Bottleneck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delay Attribution */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delay Attribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.delay_attribution ? (
              <div className="space-y-4">
                {/* By Stage */}
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">By Stage</p>
                  {Object.entries(data.delay_attribution.by_stage || {}).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(data.delay_attribution.by_stage).map(([stage, count]) => (
                        <div key={stage} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 truncate flex-1">{stage}</span>
                          <Badge variant="destructive">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No delays</p>
                  )}
                </div>
                
                {/* By Designer */}
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">By Designer</p>
                  {data.delay_attribution.by_designer?.length > 0 ? (
                    <div className="space-y-2">
                      {data.delay_attribution.by_designer.map((designer, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{designer.name}</span>
                          <Badge variant="destructive">{designer.count}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No designer delays</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No delay data</p>
            )}
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Workload Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.workload_distribution?.length > 0 ? (
              <div className="space-y-3">
                {data.workload_distribution.map((designer) => {
                  const maxProjects = Math.max(...data.workload_distribution.map(d => d.active_projects), 1);
                  return (
                    <div key={designer.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">{designer.name}</span>
                        <span className="text-sm font-medium">{designer.active_projects} projects</span>
                      </div>
                      <Progress 
                        value={(designer.active_projects / maxProjects) * 100} 
                        className="h-2" 
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No workload data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottleneck Summary */}
      {bottleneck.most_delayed_stage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Primary Bottleneck Identified</p>
                <p className="text-sm text-red-600">
                  Most delays occurring at: <span className="font-semibold">{bottleneck.most_delayed_stage}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CEODashboard;
