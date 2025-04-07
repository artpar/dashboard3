// src/components/entity/columns/editors/FileColumnEditor.tsx
import React, { useState, useRef } from 'react';
import { FileIcon, ImageIcon, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ColumnEditorProps } from '../types';

interface FileData {
  name?: string;
  path?: string;
  type?: string;
  size?: number;
  md5?: string;
  file?: string; // Base64 file content
  contents?: string; // Alternate field for Base64 content
}

/**
 * Component for uploading and editing file attachments
 */
export const FileColumnEditor: React.FC<ColumnEditorProps> = ({
                                                                value,
                                                                column,
                                                                onChange,
                                                                onBlur,
                                                                className,
                                                                error,
                                                                disabled,
                                                                placeholder
                                                              }) => {
  // Reference to the file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for tracking file uploads in progress
  const [uploading, setUploading] = useState<boolean>(false);

  // Parse existing files
  const [files, setFiles] = useState<FileData[]>(() => {
    try {
      if (!value) return [];
      return typeof value === 'string' ? JSON.parse(value) : (Array.isArray(value) ? value : [value]);
    } catch (e) {
      console.error('Error parsing file data:', e);
      return [];
    }
  });

  // Allow multiple files?
  const allowMultiple = column.ColumnName.includes('files') || files.length > 1;

  // Determine accepted file types from column definition
  const getAcceptedFileTypes = () => {
    if (!column.ColumnType) return undefined;

    const match = column.ColumnType.match(/file\.(.*)/);
    if (!match) return undefined;

    return match[1].split('|').map(ext => `.${ext}`).join(',');
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    setUploading(true);

    try {
      const newFiles: FileData[] = [];

      for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i];
        const base64 = await fileToBase64(file);

        newFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          file: base64,  // Store the base64 content
          path: ''  // Path will be determined by the server
        });
      }

      let updatedFiles: FileData[];

      if (allowMultiple) {
        // For multiple files, append to existing files
        updatedFiles = [...files, ...newFiles];
      } else {
        // For single file, replace existing file
        updatedFiles = newFiles;
      }

      setFiles(updatedFiles);
      onChange(updatedFiles);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle removing a file
  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    onChange(updatedFiles.length > 0 ? updatedFiles : null);
  };

  // Check if the file is an image
  const isImageFile = (file: FileData) => {
    const fileType = file.type || '';
    return fileType.startsWith('image/') ||
      (file.name && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name || ''));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : `${allowMultiple ? 'Add Files' : 'Choose File'}`}
        </Button>

        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple={allowMultiple}
          accept={getAcceptedFileTypes()}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2 mt-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 bg-muted p-2 rounded-md"
            >
              {file.file && isImageFile(file) ? (
                <div className="h-10 w-10 bg-background flex items-center justify-center rounded overflow-hidden">
                  <img
                    src={file.file}
                    alt={file.name || 'Preview'}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 bg-background flex items-center justify-center rounded">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {file.name || `File ${index + 1}`}
                </p>
                {file.size && (
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                disabled={disabled || uploading}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FileColumnEditor;
