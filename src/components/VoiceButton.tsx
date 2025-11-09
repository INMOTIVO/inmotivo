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

  // Generate animated wave bars
  const waveBars = Array.from({ length: 20 });

  // Show compact recording bar if recording, otherwise show mic button
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-2 border border-primary/20 animate-in fade-in duration-200">
        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          aria-label="Cancelar grabación"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Animated Wave Bars */}
        <div className="flex-1 flex items-center gap-0.5 justify-center h-8 px-2">
          {waveBars.map((_, i) => {
            const height = Math.sin((recordingTime * 3 + i) * 0.5) * 12 + 16;
            return (
              <div
                key={i}
                className="w-0.5 bg-primary rounded-full transition-all duration-150"
                style={{
                  height: `${height}px`,
                }}
              />
            );
          })}
        </div>

        {/* Timer */}
        <div className="flex-shrink-0 min-w-[2.5rem] text-center">
          <span className="text-sm font-mono font-semibold text-foreground">
            {formatTime(recordingTime)}
          </span>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
          aria-label="Enviar grabación"
        >
          <Check className="h-4 w-4 text-primary-foreground" />
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
