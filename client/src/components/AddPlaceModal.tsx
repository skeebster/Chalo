import { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, CheckCircle, FileText, AlertCircle, Link, Mic, MicOff, Square } from 'lucide-react';
import { SiInstagram } from 'react-icons/si';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreatePlace, useExtractPlaces } from "@/hooks/use-places";
import { ExtractedPlace } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

type ImportStatus = 'idle' | 'processing' | 'complete' | 'error';

export function AddPlaceModal({ open, onOpenChange, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<string>("screenshot");
  const { toast } = useToast();
  
  // Screenshot state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const [screenshotStatus, setScreenshotStatus] = useState<ImportStatus>('idle');
  const [extractedCount, setExtractedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL state
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [urlStatus, setUrlStatus] = useState<ImportStatus>('idle');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<ImportStatus>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const extractMutation = useExtractPlaces();
  const createMutation = useCreatePlace();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed') {
            setVoiceError('Microphone access denied. Please open this app in a new browser tab (click the external link icon), then allow microphone access when prompted.');
          } else if (event.error === 'no-speech') {
            setVoiceError('No speech detected. Please speak into your microphone.');
          } else if (event.error === 'audio-capture') {
            setVoiceError('No microphone found. Please connect a microphone and try again.');
          } else {
            setVoiceError(`Voice recognition error: ${event.error}`);
          }
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  // Screenshot handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
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

  const handleScreenshotUpload = async () => {
    if (!preview || !fileType) return;
    setScreenshotStatus('processing');
    setErrorMessage(null);

    try {
      const result = await extractMutation.mutateAsync({
        imageData: preview.split(',')[1],
        fileType,
      });

      if (!result.success || !result.places) {
        throw new Error("No places found in the document.");
      }

      let count = 0;
      for (const place of result.places) {
        // Try to enrich with Google Places data
        try {
          const lookupResponse = await apiRequest("POST", "/api/places/lookup", {
            name: place.name,
            context: place.address || undefined,
          });
          const lookupData = await lookupResponse.json();
          
          if (lookupData.success && lookupData.place) {
            // Merge extracted data with Google Places data
            const enrichedPlace = {
              ...lookupData.place,
              ...place, // User's extracted data takes priority for any overlapping fields
              imageUrl: fileType === 'image' ? preview : undefined,
            };
            await createMutation.mutateAsync(enrichedPlace as any);
          } else {
            // Fall back to just the extracted data
            await createMutation.mutateAsync({
              name: place.name || "Unknown Place",
              ...place,
              imageUrl: fileType === 'image' ? preview : undefined,
            } as any);
          }
        } catch {
          // Fall back to just the extracted data
          await createMutation.mutateAsync({
            name: place.name || "Unknown Place",
            ...place,
            imageUrl: fileType === 'image' ? preview : undefined,
          } as any);
        }
        count++;
      }

      setExtractedCount(count);
      setScreenshotStatus('complete');
      queryClient.invalidateQueries({ queryKey: ['/api/places'] });
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        resetState();
      }, 1500);

    } catch (error) {
      console.error(error);
      setScreenshotStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "Failed to process document");
    }
  };

  // Helper to detect URL type
  const isInstagramUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes("instagram.com") && 
             (urlObj.pathname.includes("/p/") || urlObj.pathname.includes("/reel/"));
    } catch {
      return false;
    }
  };

  const isGoogleMapsUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      
      // Direct Maps URLs
      if (hostname.includes("maps.google") || hostname === "maps.app.goo.gl") {
        return true;
      }
      
      // google.com/maps paths
      if (hostname.includes("google.com") && pathname.startsWith("/maps")) {
        return true;
      }
      
      // goo.gl short links for Maps start with /maps
      if (hostname === "goo.gl" && pathname.startsWith("/maps")) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  // URL handlers
  const handleUrlImport = async () => {
    if (!googleMapsUrl.trim()) return;
    
    setUrlStatus('processing');
    setUrlError(null);

    const url = googleMapsUrl.trim();
    
    try {
      let endpoint = "/api/places/import-url";
      
      if (isInstagramUrl(url)) {
        endpoint = "/api/places/import-instagram";
      } else if (!isGoogleMapsUrl(url)) {
        throw new Error("Please enter a Google Maps link or Instagram post/reel link");
      }
      
      const response = await apiRequest("POST", endpoint, { url });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to import from URL");
      }

      setUrlStatus('complete');
      queryClient.invalidateQueries({ queryKey: ['/api/places'] });
      toast({
        title: data.merged ? "Place updated" : "Place added",
        description: data.merged 
          ? `${data.place.name} already existed and has been updated with new information.`
          : `${data.place.name} has been added to your places.`,
      });
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (error) {
      setUrlStatus('error');
      setUrlError(error instanceof Error ? error.message : "Failed to import from URL");
    }
  };

  // Voice handlers
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setVoiceError(null);
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleVoiceSubmit = async () => {
    if (!transcript.trim()) return;
    
    setVoiceStatus('processing');
    setVoiceError(null);

    try {
      const response = await apiRequest("POST", "/api/places/import-voice", {
        transcript: transcript.trim(),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to process voice input");
      }

      setVoiceStatus('complete');
      queryClient.invalidateQueries({ queryKey: ['/api/places'] });
      toast({
        title: data.merged ? "Place updated" : "Place added",
        description: data.merged 
          ? `${data.place.name} already existed and has been updated with new information.`
          : `${data.place.name} has been added to your places.`,
      });
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (error) {
      setVoiceStatus('error');
      setVoiceError(error instanceof Error ? error.message : "Failed to process voice input");
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreview(null);
    setFileType(null);
    setScreenshotStatus('idle');
    setErrorMessage(null);
    setGoogleMapsUrl('');
    setUrlStatus('idle');
    setUrlError(null);
    setTranscript('');
    setVoiceStatus('idle');
    setVoiceError(null);
    setIsRecording(false);
  };

  const isVoiceSupported = typeof window !== 'undefined' && 
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-white/10 text-white p-0 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-secondary/30">
          <DialogTitle className="font-display text-lg uppercase tracking-wider">Add Place</DialogTitle>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start px-6 pt-4 bg-transparent border-b border-white/10">
            <TabsTrigger value="screenshot" className="data-[state=active]:bg-primary/20" data-testid="tab-screenshot">
              <Upload className="w-4 h-4 mr-2" />
              Screenshot
            </TabsTrigger>
            <TabsTrigger value="url" className="data-[state=active]:bg-primary/20" data-testid="tab-url">
              <Link className="w-4 h-4 mr-2" />
              Paste Link
            </TabsTrigger>
            <TabsTrigger value="voice" className="data-[state=active]:bg-primary/20" data-testid="tab-voice" disabled={!isVoiceSupported}>
              <Mic className="w-4 h-4 mr-2" />
              Voice
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            {/* Screenshot Tab */}
            <TabsContent value="screenshot" className="mt-0">
              {!preview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group"
                  data-testid="dropzone-screenshot"
                >
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-white mb-2">
                    Upload Instagram Screenshot or PDF
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    We'll extract the place name and look up full details
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file"
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
                      onClick={() => { setPreview(null); setSelectedFile(null); setFileType(null); setScreenshotStatus('idle'); }}
                      className="absolute top-2 right-2 bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors"
                      data-testid="button-clear-preview"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <StatusMessage status={screenshotStatus} successMessage={`Added ${extractedCount} place(s)`} errorMessage={errorMessage} />

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      onClick={() => { setPreview(null); setSelectedFile(null); setFileType(null); setScreenshotStatus('idle'); }}
                      disabled={screenshotStatus === 'processing'}
                      data-testid="button-cancel-screenshot"
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={handleScreenshotUpload}
                      disabled={screenshotStatus === 'processing' || screenshotStatus === 'complete'}
                      data-testid="button-extract-screenshot"
                    >
                      {screenshotStatus === 'processing' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : screenshotStatus === 'error' ? 'Retry' : 'Extract & Add'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="mt-0">
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                      <Link className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-muted-foreground text-sm">or</span>
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 w-12 h-12 rounded-full flex items-center justify-center">
                      <SiInstagram className="w-6 h-6 text-pink-400" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-white mb-2">
                    Paste a Link
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Google Maps or Instagram post/reel - we'll extract the place details
                  </p>
                </div>

                <Input
                  type="url"
                  placeholder="https://maps.google.com/... or https://instagram.com/p/..."
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="bg-secondary/50 border-white/10"
                  data-testid="input-google-maps-url"
                />

                <StatusMessage status={urlStatus} successMessage="Place added successfully" errorMessage={urlError} />

                <Button 
                  className="w-full" 
                  onClick={handleUrlImport}
                  disabled={!googleMapsUrl.trim() || urlStatus === 'processing' || urlStatus === 'complete'}
                  data-testid="button-import-url"
                >
                  {urlStatus === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Looking up place...
                    </>
                  ) : urlStatus === 'error' ? 'Retry' : 'Add Place'}
                </Button>
              </div>
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice" className="mt-0">
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all",
                    isRecording ? "bg-red-500/20 animate-pulse" : "bg-primary/10"
                  )}>
                    {isRecording ? (
                      <MicOff className="w-10 h-10 text-red-400" />
                    ) : (
                      <Mic className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <p className="text-lg font-medium text-white mb-2">
                    {isRecording ? "Listening..." : "Tell us about a place"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Say the name and any details you remember
                  </p>
                </div>

                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  className="w-full"
                  onClick={toggleRecording}
                  disabled={voiceStatus === 'processing'}
                  data-testid="button-toggle-recording"
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>

                {transcript && (
                  <div className="bg-secondary/50 rounded-xl p-4 border border-white/10">
                    <p className="text-sm text-muted-foreground mb-1">Transcript:</p>
                    <p className="text-white" data-testid="text-transcript">{transcript}</p>
                  </div>
                )}

                <StatusMessage status={voiceStatus} successMessage="Place added successfully" errorMessage={voiceError} />

                {transcript && !isRecording && (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => { setTranscript(''); setVoiceStatus('idle'); }}
                      disabled={voiceStatus === 'processing'}
                      data-testid="button-clear-transcript"
                    >
                      Clear
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleVoiceSubmit}
                      disabled={voiceStatus === 'processing' || voiceStatus === 'complete'}
                      data-testid="button-submit-voice"
                    >
                      {voiceStatus === 'processing' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Finding place...
                        </>
                      ) : 'Add Place'}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function StatusMessage({ status, successMessage, errorMessage }: { status: ImportStatus; successMessage: string; errorMessage?: string | null }) {
  if (status === 'processing') {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        <div>
          <p className="font-medium text-blue-100">Processing...</p>
          <p className="text-xs text-blue-300">Looking up place details</p>
        </div>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <div>
          <p className="font-medium text-green-100">Success!</p>
          <p className="text-xs text-green-300">{successMessage}</p>
        </div>
      </div>
    );
  }

  if (status === 'error' && errorMessage) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400" />
        <div>
          <p className="font-medium text-red-100">Error</p>
          <p className="text-xs text-red-300">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return null;
}
