import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Users, UserPlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { getInitials, getAvatarColor, ROLE_BADGE_STYLES } from './utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CollaboratorsTab = ({ projectId, collaborators, onCollaboratorsChange, userRole }) => {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const canAdd = ['Admin', 'Manager'].includes(userRole);
  const canRemove = userRole === 'Admin';

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/users/available`, { withCredentials: true });
      // Filter out already added collaborators
      const collaboratorIds = collaborators.map(c => c.user_id);
      setAvailableUsers(response.data.filter(u => !collaboratorIds.includes(u.user_id)));
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async (userId) => {
    try {
      setAdding(true);
      await axios.post(`${API}/projects/${projectId}/collaborators`, {
        user_id: userId
      }, { withCredentials: true });
      
      // Refetch collaborators
      const response = await axios.get(`${API}/projects/${projectId}/collaborators`, {
        withCredentials: true
      });
      onCollaboratorsChange(response.data);
      setShowAddDialog(false);
      setSearchQuery('');
      toast.success('Collaborator added');
    } catch (err) {
      console.error('Add error:', err);
      toast.error(err.response?.data?.detail || 'Failed to add collaborator');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      setRemoving(userId);
      await axios.delete(`${API}/projects/${projectId}/collaborators/${userId}`, {
        withCredentials: true
      });
      onCollaboratorsChange(collaborators.filter(c => c.user_id !== userId));
      toast.success('Collaborator removed');
    } catch (err) {
      console.error('Remove error:', err);
      toast.error('Failed to remove collaborator');
    } finally {
      setRemoving(null);
    }
  };

  const filteredUsers = availableUsers.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="collaborators-tab">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Project Collaborators
          </h3>
          {canAdd && (
            <Button
              onClick={() => {
                setShowAddDialog(true);
                fetchAvailableUsers();
              }}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="add-collaborator-btn"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Collaborator
            </Button>
          )}
        </div>

        {collaborators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-base font-medium text-slate-900">No collaborators added yet</h4>
            <p className="text-sm text-slate-500 mt-1">Add team members to this project.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {collaborators.map((collab) => (
              <div
                key={collab.user_id}
                className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 bg-white"
                data-testid={`collaborator-${collab.user_id}`}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium text-white",
                  getAvatarColor(collab.name)
                )}>
                  {collab.picture ? (
                    <img src={collab.picture} alt={collab.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(collab.name)
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{collab.name}</p>
                  <p className="text-xs text-slate-500">{collab.email}</p>
                </div>
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full font-medium",
                  ROLE_BADGE_STYLES[collab.role] || 'bg-slate-100 text-slate-600'
                )}>
                  {collab.role}
                </span>
                {canRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCollaborator(collab.user_id)}
                    disabled={removing === collab.user_id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`remove-${collab.user_id}`}
                  >
                    {removing === collab.user_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Collaborator Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddDialog(false)}>
            <div 
              className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-slate-900">Add Collaborator</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddDialog(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-3">
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    data-testid="search-users-input"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500">No users available to add</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.user_id}
                        onClick={() => handleAddCollaborator(user.user_id)}
                        disabled={adding}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                        data-testid={`add-user-${user.user_id}`}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white",
                          getAvatarColor(user.name)
                        )}>
                          {user.picture ? (
                            <img src={user.picture} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          ROLE_BADGE_STYLES[user.role] || 'bg-slate-100 text-slate-600'
                        )}>
                          {user.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
