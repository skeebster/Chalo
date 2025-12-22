import { useState, useRef } from 'react';
import { X, Upload, Loader2, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useCreatePlace, useExtractPlaces } from "@/hooks/use-places";
import { ExtractedPlace } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function UploadModal({ open, onOpenChange, onSuccess }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const [extractedCount, setExtractedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractMutation = useExtractPlaces();
  const createMutation = useCreatePlace();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // For MVP, we convert to base64 immediately for analysis
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (file.type.startsWith('image/')) {
      setFileType('image');
    } else if (file.type === 'application/pdf') {
      setFileType('pdf');
    }
  };

  const handleUpload = async () => {
    if (!preview || !fileType) return;
    setStatus('analyzing');
    setErrorMessage(null);

    try {
      // 1. Extract Data
      const result = await extractMutation.mutateAsync({
        imageData: preview.split(',')[1], // Remove data URL prefix
        fileType,
      });

      if (!result.success || !result.places) {
        throw new Error("No places found in the document.");
      }

      // 2. Create Places
      let count = 0;
      for (const place of result.places) {
        // Simple client-side check could go here, but backend should handle dupes if robust
        // We'll just create them all for now
        await createMutation.mutateAsync({
          name: place.name || "Unknown Place",
          ...place,
          imageUrl: fileType === 'image' ? preview : undefined, // Reuse uploaded image as place image for now
        } as any);
        count++;
      }

      setExtractedCount(count);
      setStatus('complete');
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        resetState();
      }, 2000);

    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "Failed to process document");
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreview(null);
    setFileType(null);
    setStatus('idle');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-white/10 text-white p-0 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-secondary/30">
          <DialogTitle className="font-display text-lg uppercase tracking-wider">Upload Document</DialogTitle>
        </div>

        <div className="p-6">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group"
            >
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-white mb-2">
                Upload Image or PDF
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                We'll automatically extract place details using AI
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-xl overflow-hidden bg-black/50 border border-white/10 h-64 flex items-center justify-center">
                {fileType === 'image' ? (
                  <img src={preview} alt="Preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto text-primary mb-2" />
                    <p className="font-medium">{selectedFile?.name}</p>
                  </div>
                )}
                <button 
                  onClick={resetState}
                  className="absolute top-2 right-2 bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {status === 'analyzing' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-100">Analyzing Document...</p>
                    <p className="text-xs text-blue-300">Extracting places and details</p>
                  </div>
                </div>
              )}

              {status === 'complete' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-medium text-green-100">Success!</p>
                    <p className="text-xs text-green-300">Added {extractedCount} new places to your library</p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="font-medium text-red-100">Extraction Failed</p>
                    <p className="text-xs text-red-300">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={resetState}
                  disabled={status === 'analyzing'}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleUpload}
                  disabled={status === 'analyzing' || status === 'complete'}
                >
                  {status === 'error' ? 'Retry' : 'Analyze & Extract'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
