import { Mic, MicOff, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  audioLevel: number;
  onStart: () => void;
  onStop: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  style?: 'default' | 'safari';
}

const VoiceButton = ({
  isRecording,
  isProcessing,
  audioLevel,
  onStart,
  onStop,
  onCancel,
  disabled = false,
  variant,
  size = 'lg',
  className,
  style = 'default'
}: VoiceButtonProps) => {
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onStop();
    }
  };

  const handleConfirm = () => {
    onStop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate animated wave bars - responsive quantity
  const waveBars = Array.from({ length: 20 });

  // Safari style variant: minimal icon + floating button when recording
  if (style === 'safari') {
    return (
      <>
        {/* Small icon inside input - always visible */}
        <button
          onClick={handleClick}
          disabled={disabled || isProcessing}
          className="p-0 hover:opacity-80 transition-opacity"
          aria-label={isRecording ? "Detener grabación" : "Iniciar grabación de voz"}
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Mic className={cn(
              "h-5 w-5 text-primary",
              isRecording && "opacity-50"
            )} />
          )}
        </button>

        {/* Floating circular button - only when recording */}
        {isRecording && (
          <div className="absolute bottom-0 left-0 -translate-y-2 translate-x-2 animate-in fade-in zoom-in duration-200">
            <button
              onClick={handleConfirm}
              className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center transition-all"
              aria-label="Detener y enviar grabación"
            >
              <Mic className="h-6 w-6 text-primary-foreground animate-pulse" />
            </button>
          </div>
        )}
      </>
    );
  }

  // Default style: Show compact recording bar if recording, otherwise show mic button
  if (isRecording) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 bg-primary/10 rounded-full px-2 sm:px-3 py-2 border border-primary/20 animate-in fade-in duration-200 w-full max-w-full min-w-0">
        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          aria-label="Cancelar grabación"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        </button>

        {/* Animated Wave Bars */}
        <div className="flex-1 flex items-center gap-[2px] sm:gap-0.5 justify-center h-8 px-1 min-w-0 overflow-hidden">
          {waveBars.map((_, i) => {
            // Crear ondas naturales con variación de frecuencia
            const time = recordingTime * 150;
            const baseWave = Math.sin((time + i * 0.8) * 2.5);
            const secondWave = Math.sin((time + i * 0.4) * 3.8) * 0.6;
            const combined = (baseWave + secondWave) / 1.6;
            
            // Altura base mínima para animación sutil
            const minHeight = 6;
            const baseHeight = combined * 8 + 14;
            
            // Multiplicador de audio más sensible
            // audioLevel va de 0 a 1, lo amplificamos para mejor respuesta visual
            const audioMultiplier = Math.max(0.15, Math.min(2.5, audioLevel * 3));
            const height = baseHeight * audioMultiplier;
            
            return (
              <div
                key={i}
                className="w-[2px] sm:w-0.5 bg-primary rounded-full flex-shrink-0"
                style={{
                  height: `${Math.max(minHeight, Math.min(32, height))}px`,
                  transition: 'height 0.05s ease-out', // Transición ultra rápida
                }}
              />
            );
          })}
        </div>

        {/* Timer */}
        <div className="flex-shrink-0 min-w-[2rem] sm:min-w-[2.5rem] text-center">
          <span className="text-xs sm:text-sm font-mono font-semibold text-foreground">
            {formatTime(recordingTime)}
          </span>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
          aria-label="Enviar grabación"
        >
          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
        </button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      variant={variant || 'default'}
      size={size}
      className={cn(
        'relative overflow-hidden transition-all',
        className
      )}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
};

export default VoiceButton;
