import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Upload, File, FileText, Image, Trash2, Download, Loader2,
  Paperclip, X, Eye, AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType) => {
  if (mimeType?.includes('pdf')) {
    return <FileText className="w-5 h-5 text-red-500" />;
  } else if (mimeType?.includes('image')) {
    return <Image className="w-5 h-5 text-blue-500" />;
  }
  return <File className="w-5 h-5 text-gray-500" />;
};

const AttachmentUploader = ({
  entityType,  // 'cashbook' | 'expense' | 'project' | 'liability'
  entityId,
  onAttachmentChange,
  readOnly = false,
  compact = false,
  maxFiles = 10,
  className = ""
}) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchAttachments = useCallback(async () => {
    if (!entityId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/finance/attachments/${entityType}/${entityId}`,
        { withCredentials: true }
      );
      setAttachments(response.data.attachments || []);
      onAttachmentChange?.(response.data.attachments || []);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, onAttachmentChange]);

  useEffect(() => {
    if (entityId) {
      fetchAttachments();
    }
  }, [entityId, fetchAttachments]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max files
    if (attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate files
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 15 * 1024 * 1024; // 15MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only PDF, JPG, PNG files are allowed`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: File size exceeds 15MB limit`);
        continue;
      }

      // Upload file
      await uploadFile(file);
    }

    // Reset input
    e.target.value = '';
  };

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/api/finance/attachments/upload?entity_type=${entityType}&entity_id=${entityId}&description=${encodeURIComponent(description)}`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.success) {
        toast.success(`${file.name} uploaded successfully`);
        setDescription('');
        fetchAttachments();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.detail || `Failed to upload ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/finance/attachments/download/${attachment.attachment_id}`,
        {
          withCredentials: true,
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handlePreview = async (attachment) => {
    if (attachment.mime_type?.includes('image')) {
      try {
        const response = await axios.get(
          `${API_URL}/api/finance/attachments/download/${attachment.attachment_id}`,
          {
            withCredentials: true,
            responseType: 'blob',
          }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        setPreviewUrl({ url, name: attachment.file_name, type: 'image' });
      } catch (error) {
        toast.error('Failed to load preview');
      }
    } else if (attachment.mime_type?.includes('pdf')) {
      // Open PDF in new tab
      window.open(
        `${API_URL}/api/finance/attachments/download/${attachment.attachment_id}`,
        '_blank'
      );
    }
  };

  const handleDelete = async (attachmentId) => {
    try {
      await axios.delete(
        `${API_URL}/api/finance/attachments/${attachmentId}`,
        { withCredentials: true }
      );
      toast.success('Attachment deleted');
      setDeleteConfirm(null);
      fetchAttachments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete attachment');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Compact view for inline usage
  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {attachments.map((att) => (
            <Badge
              key={att.attachment_id}
              variant="secondary"
              className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
              onClick={() => handleDownload(att)}
            >
              {getFileIcon(att.mime_type)}
              <span className="max-w-[100px] truncate text-xs">{att.file_name}</span>
            </Badge>
          ))}
          
          {!readOnly && entityId && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <Badge
                variant="outline"
                className="flex items-center gap-1 cursor-pointer hover:bg-gray-100"
              >
                {uploading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Paperclip className="w-3 h-3" />
                )}
                <span className="text-xs">Attach</span>
              </Badge>
            </label>
          )}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className={`space-y-4 ${className}`} data-testid="attachment-uploader">
      {/* Upload Section */}
      {!readOnly && entityId && (
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <div className="flex flex-col items-center justify-center py-4">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-400 mb-3">
                PDF, JPG, PNG up to 15MB
              </p>
              
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-48 text-sm"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Choose Files
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : attachments.length > 0 ? (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Attachments ({attachments.length})
          </Label>
          <div className="grid gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.attachment_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                data-testid={`attachment-${attachment.attachment_id}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getFileIcon(attachment.mime_type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(attachment.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(attachment.uploaded_at)}</span>
                      {attachment.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">{attachment.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {attachment.mime_type?.includes('image') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(attachment)}
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(attachment)}
                      title="Delete"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : entityId ? (
        <div className="text-center py-6 text-gray-500">
          <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No attachments yet</p>
        </div>
      ) : null}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewUrl?.name}</DialogTitle>
          </DialogHeader>
          {previewUrl?.type === 'image' && (
            <img
              src={previewUrl.url}
              alt={previewUrl.name}
              className="max-w-full max-h-[70vh] object-contain mx-auto"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.file_name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteConfirm?.attachment_id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttachmentUploader;
