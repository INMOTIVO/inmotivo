import { Mic, MicOff, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  audioLevel: number;
  realtimeTranscript?: string;
  onStart: () => void;
  onStop: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const VoiceButton = ({
  isRecording,
  isProcessing,
  audioLevel,
  realtimeTranscript = '',
  onStart,
  onStop,
  onCancel,
  disabled = false,
  variant,
  size = 'lg',
  className
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

  // Show compact recording bar if recording, otherwise show mic button
  if (isRecording) {
    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Transcripción en tiempo real */}
        {realtimeTranscript && (
          <div className="bg-background/95 backdrop-blur-sm rounded-lg px-4 py-3 border border-border animate-in fade-in duration-200">
            <p className="text-sm text-foreground leading-relaxed">
              {realtimeTranscript}
            </p>
          </div>
        )}
        
        {/* Barra de grabación */}
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
            // Create natural-looking wave with multiple frequencies and random variations
            const time = recordingTime * 175;
            const baseWave = Math.sin((time + i * 1.1) * 2.2);
            const secondWave = Math.sin((time + i * 0.5) * 3.5) * 0.7;
            const thirdWave = Math.sin((time * 1.2 + i * 1.6) * 4.2) * 0.4;
            const randomNoise = Math.sin((time * 2.0 + i * 0.9) * 5) * 0.25;
            const combined = (baseWave + secondWave + thirdWave + randomNoise) / 2.35;
            
            // Modulate wave height by actual audio level (0-1)
            // When audioLevel is low (silence), waves are small
            // When audioLevel is high (noise), waves are tall
            const baseHeight = combined * 12 + 16;
            const audioMultiplier = Math.max(0.2, audioLevel); // Minimum 0.2 to keep some animation visible
            const height = baseHeight * audioMultiplier;
            
            return (
              <div
                key={i}
                className="w-[2px] sm:w-0.5 bg-primary rounded-full transition-all duration-100 ease-out flex-shrink-0"
                style={{
                  height: `${Math.max(4, Math.min(30, height))}px`,
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
