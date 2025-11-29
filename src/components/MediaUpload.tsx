import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Star, Play, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MediaUploadProps {
  userId: string | undefined;
  media: string[];
  setMedia: (media: string[]) => void;
  coverIndex: number;
  setCoverIndex: (index: number) => void;
  maxFiles?: number;
  maxImageSizeMB?: number;
  maxVideoSizeMB?: number;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm'];

const isVideoUrl = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return ALLOWED_VIDEO_EXTENSIONS.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('/video/') ||
         lowerUrl.includes('video-');
};

const MediaUpload = ({
  userId,
  media,
  setMedia,
  coverIndex,
  setCoverIndex,
  maxFiles = 10,
  maxImageSizeMB = 5,
  maxVideoSizeMB = 500
}: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return { 
        valid: false, 
        error: `${file.name}: Formato no permitido. Usa JPG, PNG, WEBP, GIF para imágenes o MP4, MOV, AVI, WEBM para videos.` 
      };
    }

    const maxSize = isImage ? maxImageSizeMB : maxVideoSizeMB;
    const sizeMB = file.size / (1024 * 1024);
    
    if (sizeMB > maxSize) {
      return { 
        valid: false, 
        error: `${file.name}: Archivo muy grande (${sizeMB.toFixed(1)}MB). Máximo ${maxSize}MB para ${isImage ? 'imágenes' : 'videos'}.` 
      };
    }

    return { valid: true };
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (media.length + fileArray.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos. Tienes ${media.length}, intentas subir ${fileArray.length}.`);
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        errors.push(validation.error!);
        continue;
      }

      try {
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const folder = isVideo ? 'video' : 'image';
        const fileName = `${userId}/${folder}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
        errors.push(`${file.name}: Error al subir el archivo.`);
      }
    }

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
    }

    if (uploadedUrls.length > 0) {
      setMedia([...media, ...uploadedUrls]);
      const imageCount = uploadedUrls.filter(url => !isVideoUrl(url)).length;
      const videoCount = uploadedUrls.filter(url => isVideoUrl(url)).length;
      
      const parts = [];
      if (imageCount > 0) parts.push(`${imageCount} imagen${imageCount > 1 ? 'es' : ''}`);
      if (videoCount > 0) parts.push(`${videoCount} video${videoCount > 1 ? 's' : ''}`);
      
      toast.success(`${parts.join(' y ')} subido${uploadedUrls.length > 1 ? 's' : ''}`);
    }

    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
    // Reset input to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  }, [media, userId]);

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    setMedia(newMedia);

    // Adjust cover index if needed
    if (index === coverIndex) {
      setCoverIndex(0);
    } else if (index < coverIndex) {
      setCoverIndex(coverIndex - 1);
    }
  };

  const setCover = (index: number) => {
    // Only allow images as cover
    if (isVideoUrl(media[index])) {
      toast.error('Solo puedes usar imágenes como foto de portada');
      return;
    }
    setCoverIndex(index);
    toast.success('Foto de portada actualizada');
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>
          Sube hasta {maxFiles} archivos: imágenes (máx {maxImageSizeMB}MB) y videos (máx {maxVideoSizeMB}MB)
        </Label>
        
        {/* Drag & Drop Zone */}
        <div className="mt-2">
          <label
            htmlFor="media-upload"
            className={`
              flex flex-col items-center justify-center w-full h-40 
              border-2 border-dashed rounded-lg cursor-pointer 
              transition-all duration-200
              ${isDragOver 
                ? 'border-primary bg-primary/10 scale-[1.02]' 
                : 'border-muted-foreground/30 hover:bg-accent hover:border-primary/50'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Subiendo archivos...</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="flex justify-center gap-2 mb-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {isDragOver ? 'Suelta los archivos aquí' : 'Arrastra fotos y videos aquí'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  o haz clic para seleccionar
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Formatos: JPG, PNG, WEBP, GIF, MP4, MOV, AVI, WEBM
                </p>
              </div>
            )}
          </label>
          <input
            ref={fileInputRef}
            id="media-upload"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo,video/webm"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Help link */}
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">¿No sabes cómo subir archivos?</span>
          <button
            type="button"
            onClick={() => window.open('https://www.youtube.com/watch?v=INSTRUCTIVO_VIDEO_ID', '_blank')}
            className="text-primary hover:underline font-medium"
          >
            Ver instructivo →
          </button>
        </div>
      </div>

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Click en la estrella para marcar como foto de portada (solo imágenes)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {media.map((url, index) => {
              const isVideo = isVideoUrl(url);
              
              return (
                <div key={index} className="relative group aspect-video">
                  {isVideo ? (
                    // Video Preview
                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-black">
                      <video
                        src={url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 rounded-full p-3 group-hover:opacity-0 transition-opacity">
                          <Play className="h-6 w-6 text-white fill-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Film className="h-3 w-3" />
                        Video
                      </div>
                    </div>
                  ) : (
                    // Image Preview
                    <>
                      <img
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      
                      {/* Cover indicator */}
                      {index === coverIndex && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Portada
                        </div>
                      )}
                      
                      {/* Set as cover button */}
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className={`absolute top-2 left-2 transition-opacity ${
                          index === coverIndex ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={() => setCover(index)}
                        title="Marcar como portada"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  {/* Delete button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
