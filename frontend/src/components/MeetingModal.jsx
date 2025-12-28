import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Calendar, Clock, MapPin, Users, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MeetingModal = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  initialProjectId = null,
  initialLeadId = null,
  editMeeting = null
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    related_to: 'none', // 'none', 'project', 'lead'
    project_id: '',
    lead_id: '',
    scheduled_for: '',
    date: '',
    start_time: '',
    end_time: '',
    location: ''
  });

  // Fetch projects, leads, and users
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setLoadingData(true);
        try {
          const [projectsRes, leadsRes, usersRes] = await Promise.all([
            axios.get(`${API_URL}/api/projects`, { withCredentials: true }).catch(() => ({ data: [] })),
            axios.get(`${API_URL}/api/leads`, { withCredentials: true }).catch(() => ({ data: [] })),
            axios.get(`${API_URL}/api/users/active`, { withCredentials: true }).catch(() => ({ data: [] }))
          ]);
          
          setProjects(projectsRes.data || []);
          setLeads(leadsRes.data || []);
          setActiveUsers(usersRes.data || []);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoadingData(false);
        }
      };
      
      fetchData();
    }
  }, [open]);

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (editMeeting) {
        // Edit mode
        setFormData({
          title: editMeeting.title || '',
          description: editMeeting.description || '',
          related_to: editMeeting.project_id ? 'project' : editMeeting.lead_id ? 'lead' : 'none',
          project_id: editMeeting.project_id || '',
          lead_id: editMeeting.lead_id || '',
          scheduled_for: editMeeting.scheduled_for || '',
          date: editMeeting.date || '',
          start_time: editMeeting.start_time || '',
          end_time: editMeeting.end_time || '',
          location: editMeeting.location || ''
        });
      } else {
        // Create mode with initial values
        const isDesignerOrPreSales = user?.role === 'Designer' || user?.role === 'PreSales';
        
        setFormData({
          title: '',
          description: '',
          related_to: initialProjectId ? 'project' : initialLeadId ? 'lead' : 'none',
          project_id: initialProjectId || '',
          lead_id: initialLeadId || '',
          scheduled_for: isDesignerOrPreSales ? user?.user_id : '',
          date: '',
          start_time: '',
          end_time: '',
          location: ''
        });
      }
    }
  }, [open, editMeeting, initialProjectId, initialLeadId, user]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.title) {
      toast.error('Please enter a meeting title');
      return;
    }
    if (!formData.scheduled_for) {
      toast.error('Please select who the meeting is for');
      return;
    }
    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      toast.error('Please set start and end time');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        project_id: formData.related_to === 'project' ? formData.project_id : null,
        lead_id: formData.related_to === 'lead' ? formData.lead_id : null,
        scheduled_for: formData.scheduled_for,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location
      };

      if (editMeeting) {
        await axios.put(`${API_URL}/api/meetings/${editMeeting.id}`, payload, {
          withCredentials: true
        });
        toast.success('Meeting updated successfully');
      } else {
        await axios.post(`${API_URL}/api/meetings`, payload, {
          withCredentials: true
        });
        toast.success('Meeting scheduled successfully');
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast.error(error.response?.data?.detail || 'Failed to save meeting');
    } finally {
      setLoading(false);
    }
  };

  const isPreSales = user?.role === 'PreSales';
  const isDesigner = user?.role === 'Designer';
  const canAssignToOthers = user?.role === 'Admin' || user?.role === 'Manager';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            {editMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
          </DialogTitle>
          <DialogDescription>
            {editMeeting ? 'Update meeting details' : 'Add a new meeting to the calendar'}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Title */}
            <div>
              <Label htmlFor="meeting-title">Meeting Title *</Label>
              <Input
                id="meeting-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Site measurement meeting"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="meeting-description">Description</Label>
              <Textarea
                id="meeting-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Meeting agenda or notes..."
                rows={3}
              />
            </div>

            {/* Related To */}
            {!isPreSales && (
              <div>
                <Label>Related To</Label>
                <Select
                  value={formData.related_to}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    related_to: value,
                    project_id: value !== 'project' ? '' : prev.project_id,
                    lead_id: value !== 'lead' ? '' : prev.lead_id
                  }))}
                  disabled={isPreSales}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No relation (General meeting)</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Project Selection */}
            {formData.related_to === 'project' && (
              <div>
                <Label>Select Project *</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.project_id} value={project.project_id}>
                        {project.project_name} - {project.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Lead Selection */}
            {(formData.related_to === 'lead' || isPreSales) && (
              <div>
                <Label>Select Lead *</Label>
                <Select
                  value={formData.lead_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map(lead => (
                      <SelectItem key={lead.lead_id} value={lead.lead_id}>
                        {lead.customer_name} - {lead.customer_phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Scheduled For (Designer) */}
            <div>
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Schedule For *
              </Label>
              <Select
                value={formData.scheduled_for}
                onValueChange={(value) => setFormData(prev => ({ ...prev, scheduled_for: value }))}
                disabled={isDesigner || isPreSales}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select attendee" />
                </SelectTrigger>
                <SelectContent>
                  {activeUsers.map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(isDesigner || isPreSales) && (
                <p className="text-xs text-slate-500 mt-1">Meeting will be scheduled for yourself</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date *
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start *
                </Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  End *
                </Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Client's office, Site address..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || loadingData}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              editMeeting ? 'Update Meeting' : 'Schedule Meeting'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
