import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, StickyNote, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from './utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const NotesTab = ({ projectId, notes, onNotesChange, userRole, currentUserId }) => {
  const [selectedNote, setSelectedNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const saveTimeoutRef = useRef(null);

  const canCreate = ['Admin', 'Manager', 'Designer'].includes(userRole);

  const canEdit = (note) => {
    return note.created_by === currentUserId || userRole === 'Admin';
  };

  // Auto-save on content change
  useEffect(() => {
    if (!selectedNote || !canEdit(selectedNote)) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (editTitle !== selectedNote.title || editContent !== selectedNote.content) {
        try {
          setSaving(true);
          const response = await axios.put(
            `${API}/projects/${projectId}/notes/${selectedNote.id}`,
            { title: editTitle, content: editContent },
            { withCredentials: true }
          );
          
          onNotesChange(notes.map(n => n.id === selectedNote.id ? response.data : n));
          setSelectedNote(response.data);
        } catch (err) {
          console.error('Save error:', err);
          toast.error('Failed to save note');
        } finally {
          setSaving(false);
        }
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTitle, editContent]);

  const handleCreateNote = async () => {
    try {
      setIsCreating(true);
      const response = await axios.post(`${API}/projects/${projectId}/notes`, {
        title: 'Untitled Note',
        content: ''
      }, { withCredentials: true });
      
      onNotesChange([...notes, response.data]);
      setSelectedNote(response.data);
      setEditTitle(response.data.title);
      setEditContent(response.data.content);
      toast.success('Note created');
    } catch (err) {
      console.error('Create error:', err);
      toast.error('Failed to create note');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  return (
    <div className="flex gap-6 min-h-[500px]" data-testid="notes-tab">
      {/* Notes List (Left) */}
      <div className="w-64 flex-shrink-0 border-r border-slate-200 pr-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
          {canCreate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateNote}
              disabled={isCreating}
              className="h-8 px-2"
              data-testid="create-note-btn"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          )}
        </div>
        
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No notes yet</p>
            {canCreate && (
              <p className="text-xs text-slate-400 mt-1">Create the first note</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  selectedNote?.id === note.id 
                    ? "bg-blue-50 border border-blue-200" 
                    : "bg-white border border-slate-200 hover:border-slate-300"
                )}
                data-testid={`note-item-${note.id}`}
              >
                <p className="text-sm font-medium text-slate-900 truncate">{note.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {note.created_by_name} • {formatRelativeTime(note.updated_at)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Note Editor (Right) */}
      <div className="flex-1">
        {selectedNote ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {canEdit(selectedNote) ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
                    placeholder="Note title"
                    data-testid="note-title-input"
                  />
                ) : (
                  <h3 className="text-lg font-semibold text-slate-900">{selectedNote.title}</h3>
                )}
                {saving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              </div>
              {!canEdit(selectedNote) && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Read-only</span>
              )}
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
              Created by {selectedNote.created_by_name} • Updated {formatRelativeTime(selectedNote.updated_at)}
            </p>
            
            {canEdit(selectedNote) ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 w-full p-3 rounded-lg border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Start writing..."
                data-testid="note-content-input"
              />
            ) : (
              <div className="flex-1 w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm whitespace-pre-wrap overflow-auto">
                {selectedNote.content || 'No content'}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <StickyNote className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Select a note to view or edit</p>
          </div>
        )}
      </div>
    </div>
  );
};
