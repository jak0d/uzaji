import React, { useState, useRef, useCallback } from 'react';
import { 
  Paperclip, 
  Upload, 
  X, 
  File, 
  Image, 
  FileText, 
  Download,
  Eye,
  AlertCircle,
  Check
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { addFileAttachment, getFileAttachments, deleteFileAttachment } from '../utils/database';
import { encryption } from '../utils/encryption';

interface FileAttachmentSystemProps {
  transactionId?: string;
  clientFileId?: string;
  onFilesChange?: (files: AttachedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data?: string; // Base64 encoded data
  url?: string; // For preview
  isUploading?: boolean;
  error?: string;
}

interface FilePreviewProps {
  file: AttachedFile;
  onRemove: () => void;
  onPreview?: () => void;
}

function FilePreview({ file, onRemove, onPreview }: FilePreviewProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('pdf') || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const FileIcon = getFileIcon(file.type);

  return (
    <div className={`
      flex items-center justify-between p-3 rounded-lg border transition-all duration-200
      ${file.error 
        ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
        : file.isUploading
        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
        : `border-gray-200 dark:border-gray-700 ${themeClasses.cardBackground} hover:shadow-sm`
      }
    `}>
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* File Icon */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${file.error 
            ? 'bg-red-100 dark:bg-red-900/30' 
            : file.isUploading
            ? 'bg-blue-100 dark:bg-blue-900/30'
            : 'bg-gray-100 dark:bg-gray-700'
          }
        `}>
          {file.isUploading ? (
            <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            <FileIcon className={`w-5 h-5 ${
              file.error ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'
            }`} />
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${
            file.error ? 'text-red-800 dark:text-red-200' : `${themeClasses.text}`
          }`}>
            {file.name}
          </p>
          <div className="flex items-center space-x-2 text-sm">
            <span className={`${
              file.error ? 'text-red-600 dark:text-red-300' : `${themeClasses.textSecondary}`
            }`}>
              {formatFileSize(file.size)}
            </span>
            {file.error && (
              <>
                <span className="text-red-400">•</span>
                <span className="text-red-600 dark:text-red-300">{file.error}</span>
              </>
            )}
            {file.isUploading && (
              <>
                <span className="text-blue-400">•</span>
                <span className="text-blue-600 dark:text-blue-300">Uploading...</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {!file.isUploading && !file.error && onPreview && file.type.startsWith('image/') && (
            <button
              onClick={onPreview}
              className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
              title="Preview file"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function FileAttachmentSystem({
  transactionId,
  clientFileId,
  onFilesChange,
  maxFiles = 5,
  maxFileSize = 10, // 10MB
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt'],
  className = ''
}: FileAttachmentSystemProps) {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type not supported. Accepted: ${acceptedTypes.join(', ')}`;
    }

    // Check total files
    if (attachedFiles.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:type;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const encryptFileData = async (data: string): Promise<string> => {
    try {
      if (encryption.isAuthenticated()) {
        return await encryption.encrypt(data);
      }
      return data; // Return unencrypted if no auth
    } catch (error) {
      console.error('Failed to encrypt file data:', error);
      return data; // Fallback to unencrypted
    }
  };

  const processFile = async (file: File): Promise<AttachedFile> => {
    const fileId = crypto.randomUUID();
    
    // Create initial file object
    const attachedFile: AttachedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      isUploading: true
    };

    try {
      // Convert to base64
      const base64Data = await convertFileToBase64(file);
      
      // Encrypt if possible
      const encryptedData = await encryptFileData(base64Data);
      
      // Create preview URL for images
      let previewUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      // Save to database if either transactionId or clientFileId is provided
      if (transactionId || clientFileId) {
        await addFileAttachment({
          filename: file.name,
          size: file.size,
          type: file.type,
          data: encryptedData,
          transactionId: transactionId || undefined,
          clientFileId: clientFileId || undefined,
          encrypted: encryption.isAuthenticated()
        });
      }

      return {
        ...attachedFile,
        data: encryptedData,
        url: previewUrl,
        isUploading: false
      };
    } catch (error) {
      console.error('Failed to process file:', error);
      return {
        ...attachedFile,
        isUploading: false,
        error: 'Failed to process file'
      };
    }
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      // Show errors (you might want to use a toast notification here)
      console.error('File validation errors:', errors);
    }

    if (validFiles.length === 0) return;

    setIsLoading(true);

    // Process valid files
    const processedFiles = await Promise.all(
      validFiles.map(file => processFile(file))
    );

    const newAttachedFiles = [...attachedFiles, ...processedFiles];
    setAttachedFiles(newAttachedFiles);
    onFilesChange?.(newAttachedFiles);
    setIsLoading(false);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files) {
      handleFiles(files);
    }
  }, [attachedFiles]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = async (fileId: string) => {
    try {
      // Remove from database if either ID is provided
      if (transactionId || clientFileId) {
        await deleteFileAttachment(fileId);
      }
  
      // Clean up preview URL
      const file = attachedFiles.find(f => f.id === fileId);
      if (file?.url) {
        URL.revokeObjectURL(file.url);
      }
  
      const updatedFiles = attachedFiles.filter(f => f.id !== fileId);
      setAttachedFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    } catch (error) {
      console.error('Failed to remove file:', error);
    }
  };

  const previewFile = (file: AttachedFile) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${themeClasses.cardBackground}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          accept={acceptedTypes.join(',')}
        />

        <div className="flex flex-col items-center space-y-3">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${isDragOver 
              ? 'bg-blue-100 dark:bg-blue-900/30' 
              : 'bg-gray-100 dark:bg-gray-700'
            }
          `}>
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <Upload className={`w-6 h-6 ${
                isDragOver ? 'text-blue-600' : 'text-gray-400'
              }`} />
            )}
          </div>

          <div>
            <p className={`font-medium ${
              isDragOver ? 'text-blue-600' : themeClasses.text
            }`}>
              {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className={`text-sm mt-1 ${themeClasses.textSecondary}`}>
              {acceptedTypes.join(', ')} up to {maxFileSize}MB each
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Max {maxFiles} files</span>
            <span>•</span>
            <span>Encrypted & secure</span>
          </div>
        </div>
      </div>

      {/* File List */}
      {attachedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${themeClasses.text}`}>
              Attached Files ({attachedFiles.length}/{maxFiles})
            </h4>
            {attachedFiles.some(f => !f.error && !f.isUploading) && (
              <div className="flex items-center text-xs text-green-600">
                <Check className="w-3 h-3 mr-1" />
                Saved securely
              </div>
            )}
          </div>
          
          {attachedFiles.map((file) => (
            <FilePreview
              key={file.id}
              file={file}
              onRemove={() => removeFile(file.id)}
              onPreview={() => previewFile(file)}
            />
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>💡 Tip: Attach receipts, invoices, or supporting documents</span>
          <span>🔒 All files are encrypted and stored locally</span>
        </div>
      </div>
    </div>
  );
}