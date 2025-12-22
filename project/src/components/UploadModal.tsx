import { useState, useRef } from 'react';
import { X, Upload, Loader2, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

type ExtractedPlace = {
  name: string;
  overview?: string;
  address?: string;
  google_maps_url?: string;
  distance_miles?: number;
  drive_time_minutes?: number;
  category?: string;
  subcategory?: string;
  key_highlights?: string;
  insider_tips?: string;
  entry_fee?: string;
  average_spend?: number;
  best_seasons?: string;
  best_day?: string;
  parking_info?: string;
  ev_charging?: string;
  google_rating?: number;
  tripadvisor_rating?: number;
  overall_sentiment?: string;
  nearby_restaurants?: Array<{name: string; description: string}>;
  average_visit_duration?: string;
  upcoming_events?: string;
  research_sources?: string;
};

export default function UploadModal({ onClose, onSuccess }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'>('idle');
  const [extractedCount, setExtractedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      setFileType('image');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setFileType('pdf');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeDocument = async (fileData: string, type: 'image' | 'pdf'): Promise<ExtractedPlace[]> => {
    setStatus('analyzing');

    try {
      const base64Data = fileData.split(',')[1];
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('Calling extraction edge function...');

      const response = await fetch(`${supabaseUrl}/functions/v1/extract-places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileType: type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Edge function error:', errorData);
        throw new Error(errorData.error || `Extraction failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Extraction result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      const places = result.places || [];
      console.log(`Successfully extracted ${places.length} places:`, places.map((p: ExtractedPlace) => p.name));

      return places;
    } catch (error) {
      console.error('Error analyzing document:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setStatus('error');
      return [];
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview || !fileType) return;

    setProcessing(true);
    setStatus('uploading');
    setErrorMessage(null);

    try {
      const extractedPlaces = await analyzeDocument(preview, fileType);

      if (extractedPlaces.length === 0 && status === 'error') {
        setProcessing(false);
        return;
      }

      if (extractedPlaces.length === 0) {
        setErrorMessage('No places found in the document. Please try a different file.');
        setStatus('error');
        setProcessing(false);
        return;
      }

      const { data: existingPlaces } = await supabase
        .from('places')
        .select('name');

      const existingNames = new Set(
        (existingPlaces || []).map(p => p.name.toLowerCase().trim())
      );

      const newPlaces = extractedPlaces.filter(
        (place: ExtractedPlace) => !existingNames.has((place.name || '').toLowerCase().trim())
      );

      const skipped = extractedPlaces.length - newPlaces.length;
      setSkippedCount(skipped);

      if (newPlaces.length === 0) {
        setExtractedCount(0);
        setStatus('complete');
        setTimeout(() => {
          onSuccess();
        }, 1500);
        return;
      }

      const placesToInsert = newPlaces.map((place: ExtractedPlace) => ({
        name: place.name || 'Unnamed Place',
        overview: place.overview || null,
        address: place.address || null,
        google_maps_url: place.google_maps_url || null,
        distance_miles: place.distance_miles || null,
        drive_time_minutes: place.drive_time_minutes || null,
        category: place.category || null,
        subcategory: place.subcategory || null,
        key_highlights: place.key_highlights || null,
        insider_tips: place.insider_tips || null,
        entry_fee: place.entry_fee || null,
        average_spend: place.average_spend || null,
        best_seasons: place.best_seasons || null,
        best_day: place.best_day || null,
        parking_info: place.parking_info || null,
        ev_charging: place.ev_charging || null,
        google_rating: place.google_rating || null,
        tripadvisor_rating: place.tripadvisor_rating || null,
        overall_sentiment: place.overall_sentiment || null,
        nearby_restaurants: place.nearby_restaurants || [],
        average_visit_duration: place.average_visit_duration || null,
        upcoming_events: place.upcoming_events || null,
        research_sources: place.research_sources || null,
        image_url: fileType === 'image' ? preview : null,
        visited: false,
      }));

      const { error } = await supabase.from('places').insert(placesToInsert);

      if (error) throw error;

      setExtractedCount(newPlaces.length);
      setStatus('complete');

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Error uploading:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload. Please try again.');
      setStatus('error');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-white/[0.08] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-800 border-b border-white/[0.06] px-6 py-4 flex justify-between items-center">
          <h2 className="text-base font-semibold text-white uppercase tracking-wider">Upload Document</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="p-6">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-white/[0.12] rounded-lg p-12 text-center hover:border-rust-500/50 hover:bg-white/[0.02] transition-all cursor-pointer"
            >
              <Upload className="w-12 h-12 mx-auto text-rust-400/70 mb-4" />
              <p className="text-sm font-medium text-white mb-2 uppercase tracking-wider">
                Upload Image or PDF
              </p>
              <p className="text-xs text-white/40 mb-4">
                Can contain multiple places - AI will extract them all
              </p>
              <p className="text-xs text-white/25">
                PNG, JPG, PDF up to 20MB
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
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-dark-900 border border-white/[0.06]">
                {fileType === 'image' ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto text-rust-400/70 mb-4" />
                      <p className="text-white font-medium uppercase tracking-wider text-sm">PDF Selected</p>
                      <p className="text-white/40 text-xs mt-2">{selectedFile?.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {status !== 'idle' && (
                <div className={`rounded-lg p-4 ${
                  status === 'error'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-rust-500/10 border border-rust-500/20'
                }`}>
                  <div className="flex items-center space-x-3">
                    {status === 'complete' ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-rust-400" />
                        <div>
                          <span className="text-white font-medium block text-sm">
                            {extractedCount} {extractedCount === 1 ? 'Place' : 'Places'} Added Successfully!
                          </span>
                          <span className="text-white/50 text-xs">
                            {skippedCount > 0
                              ? `${skippedCount} duplicate${skippedCount === 1 ? '' : 's'} skipped`
                              : 'AI extracted all places from your document'
                            }
                          </span>
                        </div>
                      </>
                    ) : status === 'error' ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <div>
                          <span className="text-white font-medium block text-sm">
                            Extraction Failed
                          </span>
                          <span className="text-red-300/70 text-xs">
                            {errorMessage || 'An error occurred. Please try again.'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-5 h-5 text-rust-400 animate-spin" />
                        <div>
                          <span className="text-white font-medium block text-sm">
                            {status === 'uploading' && 'Processing Document...'}
                            {status === 'analyzing' && 'AI Analyzing - Extracting All Places...'}
                          </span>
                          <span className="text-white/50 text-xs">
                            This may take a moment for spreadsheets and multi-page documents
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {(status === 'idle' || status === 'error') && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setFileType(null);
                      setStatus('idle');
                      setErrorMessage(null);
                    }}
                    className="flex-1 px-4 py-3 border border-white/[0.08] rounded-lg hover:bg-white/[0.03] transition-colors text-white/70 font-medium uppercase tracking-wider text-xs"
                  >
                    Choose Different File
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-rust-500 hover:bg-rust-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium uppercase tracking-wider text-xs"
                  >
                    {status === 'error' ? 'Retry Extraction' : 'Analyze & Extract Places'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
