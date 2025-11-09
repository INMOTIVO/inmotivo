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
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (isRecording) {
      setShowOverlay(true);
      setRecordingTime(0);
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setShowOverlay(false);
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
    setShowOverlay(false);
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

  // Generate animated dots for progress bar
  const dots = Array.from({ length: 30 });

  return (
    <>
      {/* Recording Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md mx-4">
            <div className="bg-primary/10 rounded-2xl p-6 shadow-lg border border-primary/20">
              {/* Header */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <Mic className="h-5 w-5 text-primary" />
                <span className="text-lg font-medium text-foreground">
                  Grabando audio...
                </span>
              </div>

              {/* Progress Bar */}
              <div className="bg-background/50 rounded-full p-4 mb-4 relative overflow-hidden">
                <div className="flex items-center justify-between gap-3">
                  {/* Cancel Button */}
                  <button
                    onClick={handleCancel}
                    className="flex-shrink-0 w-12 h-12 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                    aria-label="Cancelar grabación"
                  >
                    <X className="h-6 w-6 text-muted-foreground" />
                  </button>

                  {/* Animated Dots */}
                  <div className="flex-1 flex items-center gap-1 justify-center">
                    {dots.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          i < (recordingTime % 30) || recordingTime >= 30
                            ? "bg-primary scale-100"
                            : "bg-muted scale-75"
                        )}
                        style={{
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Timer */}
                  <div className="flex-shrink-0 min-w-[3rem] text-center">
                    <span className="text-lg font-mono font-semibold text-foreground">
                      {formatTime(recordingTime)}
                    </span>
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirm}
                    className="flex-shrink-0 w-12 h-12 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shadow-lg"
                    aria-label="Enviar grabación"
                  >
                    <Check className="h-6 w-6 text-primary-foreground" />
                  </button>
                </div>
              </div>

              {/* Hint */}
              <p className="text-center text-sm text-muted-foreground">
                Presiona ✓ para enviar o ✕ para cancelar
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Original Button */}
      <div className="relative">
        <Button
          onClick={handleClick}
          disabled={disabled || isProcessing}
          variant={isRecording ? 'destructive' : variant || 'default'}
          size={size}
          className={cn(
            'relative overflow-hidden transition-all',
            isRecording && 'animate-pulse',
            className
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>

        {/* Audio level indicator */}
        {isRecording && (
          <div className="absolute -inset-2 pointer-events-none">
            <div 
              className="absolute inset-0 rounded-full bg-destructive/30 animate-ping"
              style={{
                transform: `scale(${1 + audioLevel * 0.5})`,
                transition: 'transform 0.1s ease-out'
              }}
            />
            <div 
              className="absolute inset-0 rounded-full bg-destructive/20"
              style={{
                transform: `scale(${1 + audioLevel * 0.3})`,
                transition: 'transform 0.1s ease-out'
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default VoiceButton;
