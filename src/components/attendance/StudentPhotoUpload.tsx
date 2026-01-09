/**
 * StudentPhotoUpload.tsx - Admin Student Photo Upload Component
 * 
 * This component allows administrators to:
 * - Select a student from a dropdown
 * - Upload a passport-size reference photo (JPG/PNG)
 * - Preview the uploaded photo
 * - Save the photo linked to the student's profile
 * 
 * The uploaded photo serves as the reference for future face verification
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { students, getStudentPhoto, saveStudentPhoto } from '@/lib/attendanceData';
import { Upload, User, Check, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StudentPhotoUpload = () => {
  // State for selected student and photo
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  /**
   * Handle student selection from dropdown
   * Loads existing photo if available
   */
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setPreviewImage(null);
    
    // Check if student already has a photo
    const existing = getStudentPhoto(studentId);
    setExistingPhoto(existing);
  };

  /**
   * Handle file input change
   * Validates file type and creates preview
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (JPG or PNG only)
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG or PNG image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Create preview using FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Trigger file input click
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Clear the selected image
   */
  const handleClearImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Save the uploaded photo
   */
  const handleSave = () => {
    if (!selectedStudentId || !previewImage) return;

    setIsUploading(true);

    // Save photo to localStorage (simulated storage)
    saveStudentPhoto(selectedStudentId, previewImage);

    // Update UI
    setExistingPhoto(previewImage);
    setPreviewImage(null);
    setIsUploading(false);

    const student = students.find(s => s.id === selectedStudentId);
    toast({
      title: 'Photo saved!',
      description: `Reference photo for ${student?.name} has been saved.`,
    });

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get selected student details
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <Card className="p-6 card-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Image size={20} className="text-primary" />
        <h3 className="font-semibold font-display">Upload Student Photo</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Upload a clear passport-size photo for face verification reference.
      </p>

      {/* Student Selection Dropdown */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Student</label>
          <Select value={selectedStudentId} onValueChange={handleStudentSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a student..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} ({student.id}) - {student.grade}
                </SelectItem>
              ))
              }
            </SelectContent>
          </Select>
        </div>

        {/* Photo Upload Section - shown when student is selected */}
        {selectedStudentId && (
          <div className="space-y-4">
            {/* Existing Photo Display */}
            {existingPhoto && !previewImage && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Photo</label>
                <div className="w-32 h-40 rounded-lg overflow-hidden border border-border">
                  <img
                    src={existingPhoto}
                    alt={`${selectedStudent?.name}'s photo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {existingPhoto ? 'Upload New Photo' : 'Upload Photo'}
              </label>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Preview or Upload Button */}
              {previewImage ? (
                <div className="space-y-3">
                  <div className="w-32 h-40 rounded-lg overflow-hidden border-2 border-primary relative">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={handleClearImage}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  
                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={isUploading}
                    className="w-full gradient-success text-primary-foreground"
                  >
                    <Check size={16} className="mr-2" />
                    {isUploading ? 'Saving...' : 'Save Photo'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleUploadClick}
                  className="w-full h-24 border-dashed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={24} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload JPG or PNG
                    </span>
                  </div>
                </Button>
              )}
            </div>

            {/* Student Info Card */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{selectedStudent?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedStudent?.id} • {selectedStudent?.grade}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StudentPhotoUpload;
