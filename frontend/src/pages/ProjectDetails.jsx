import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, FolderKanban, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Stage badge styles
const STAGE_STYLES = {
  'Pre 10%': 'bg-slate-100 text-slate-600',
  '10-50%': 'bg-amber-100 text-amber-700',
  '50-100%': 'bg-blue-100 text-blue-700',
  'Completed': 'bg-green-100 text-green-700'
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/projects/${id}`, {
          withCredentials: true
        });
        setProject(response.data);
      } catch (err) {
        console.error('Failed to fetch project:', err);
        setError(err.response?.data?.detail || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" data-testid="project-loading">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6" data-testid="project-error">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/projects')}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="project-details-page">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/projects')}
          className="text-slate-600 hover:text-slate-900"
          data-testid="back-to-projects-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 
            className="text-3xl font-bold tracking-tight text-slate-900"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {project?.project_name}
          </h1>
          <p className="text-slate-500 mt-1">
            Client: {project?.client_name}
          </p>
        </div>
        {project?.stage && (
          <span 
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
              STAGE_STYLES[project.stage] || 'bg-slate-100 text-slate-600'
            )}
            data-testid="project-stage-badge"
          >
            {project.stage}
          </span>
        )}
      </div>

      {/* Project Info Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Client Phone</p>
              <p className="text-slate-900">{project?.client_phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Stage</p>
              <p className="text-slate-900">{project?.stage}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Summary</p>
              <p className="text-slate-900">{project?.summary || 'No summary provided'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Collaborators</p>
              <div className="flex flex-wrap gap-2">
                {project?.collaborators?.map((collab) => (
                  <span 
                    key={collab.user_id} 
                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                  >
                    {collab.name}
                  </span>
                ))}
                {(!project?.collaborators || project.collaborators.length === 0) && (
                  <span className="text-slate-500 text-sm">No collaborators assigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Placeholder for future features */}
          <div className="border-t border-slate-200 pt-6 mt-6">
            <div className="text-center py-8 text-slate-500">
              <p>Detailed project view will be implemented in the next phase.</p>
              <p className="text-sm mt-2">View project timeline, tasks, documents, and team assignments.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetails;
