import { useState, useEffect } from 'react';
import { getFileAttachments, deleteFileAttachment } from '../utils/database';
import { encryption } from '../utils/encryption';
import type { FileAttachment } from '../utils/database';

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data?: string;
  url?: string;
  encrypted: boolean;
  createdAt: string;
}

interface UseFileAttachmentsReturn {
  attachments: AttachedFile[];
  isLoading: boolean;
  error: string | null;
  loadAttachments: (transactionId: string) => Promise<void>;
  removeAttachment: (attachmentId: string) => Promise<void>;
  downloadAttachment: (attachment: AttachedFile) => void;
  previewAttachment: (attachment: AttachedFile) => void;
}

export function useFileAttachments(): UseFileAttachmentsReturn {
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decryptFileData = async (encryptedData: string): Promise<string> => {
    try {
      if (encryption.isAuthenticated()) {
        return await encryption.decrypt(encryptedData);
      }
      return encryptedData; // Return as-is if not encrypted
    } catch (error) {
      console.error('Failed to decrypt file data:', error);
      throw new Error('Failed to decrypt file data');
    }
  };

  const loadAttachments = async (transactionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const fileAttachments = await getFileAttachments(transactionId);
      
      const processedAttachments: AttachedFile[] = await Promise.all(
        fileAttachments.map(async (attachment: FileAttachment) => {
          try {
            // Decrypt data if encrypted
            let data = attachment.data;
            if (attachment.encrypted) {
              data = await decryptFileData(attachment.data);
            }

            // Create preview URL for images
            let previewUrl: string | undefined;
            if (attachment.type.startsWith('image/')) {
              const blob = new Blob([Uint8Array.from(atob(data), c => c.charCodeAt(0))], {
                type: attachment.type
              });
              previewUrl = URL.createObjectURL(blob);
            }

            return {
              id: attachment.id,
              name: attachment.filename,
              size: attachment.size,
              type: attachment.type,
              data,
              url: previewUrl,
              encrypted: attachment.encrypted,
              createdAt: attachment.createdAt
            };
          } catch (error) {
            console.error(`Failed to process attachment ${attachment.filename}:`, error);
            return {
              id: attachment.id,
              name: attachment.filename,
              size: attachment.size,
              type: attachment.type,
              encrypted: attachment.encrypted,
              createdAt: attachment.createdAt
            };
          }
        })
      );

      setAttachments(processedAttachments);
    } catch (err) {
      console.error('Failed to load attachments:', err);
      setError('Failed to load file attachments');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      await deleteFileAttachment(attachmentId);
      
      // Clean up preview URL
      const attachment = attachments.find(a => a.id === attachmentId);
      if (attachment?.url) {
        URL.revokeObjectURL(attachment.url);
      }
      
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (err) {
      console.error('Failed to remove attachment:', err);
      setError('Failed to remove file attachment');
    }
  };

  const downloadAttachment = (attachment: AttachedFile) => {
    try {
      if (!attachment.data) {
        throw new Error('File data not available');
      }

      // Convert base64 to blob
      const byteCharacters = atob(attachment.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.type });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download attachment:', err);
      setError('Failed to download file');
    }
  };

  const previewAttachment = (attachment: AttachedFile) => {
    try {
      if (attachment.url) {
        // Use existing preview URL
        window.open(attachment.url, '_blank');
      } else if (attachment.data) {
        // Create temporary preview URL
        const byteCharacters = atob(attachment.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: attachment.type });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      console.error('Failed to preview attachment:', err);
      setError('Failed to preview file');
    }
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach(attachment => {
        if (attachment.url) {
          URL.revokeObjectURL(attachment.url);
        }
      });
    };
  }, []);

  return {
    attachments,
    isLoading,
    error,
    loadAttachments,
    removeAttachment,
    downloadAttachment,
    previewAttachment
  };
}

// Utility functions for file handling
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (type: string): string => {
  if (type.startsWith('image/')) return '🖼️';
  if (type.includes('pdf')) return '📄';
  if (type.includes('document') || type.includes('word')) return '📝';
  if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
  return '📎';
};

export const isPreviewable = (type: string): boolean => {
  return type.startsWith('image/') || type.includes('pdf');
};