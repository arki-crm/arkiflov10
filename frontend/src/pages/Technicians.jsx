import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { 
  Loader2,
  FileX2,
  User,
  Wrench,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Technicians = () => {
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/technicians`, { withCredentials: true });
      setTechnicians(response.data);
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
      toast.error('Failed to load technicians');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="technicians-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Technicians
        </h1>
        <p className="text-slate-500 mt-1">
          {technicians.length} technicians
        </p>
      </div>

      {/* Technicians List */}
      {technicians.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileX2 className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No technicians found</h3>
            <p className="text-slate-500">Invite users with the Technician role from User Management</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((tech) => (
            <Card key={tech.user_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{tech.name}</h3>
                    <p className="text-sm text-slate-500">{tech.email}</p>
                    {tech.phone && <p className="text-sm text-slate-500">{tech.phone}</p>}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="w-4 h-4 text-slate-400" />
                    <span className={cn(
                      tech.open_requests > 0 ? 'text-amber-600 font-medium' : 'text-slate-500'
                    )}>
                      {tech.open_requests} open requests
                    </span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Technicians;
