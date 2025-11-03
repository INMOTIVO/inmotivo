import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  audioLevel: number;
  onStart: () => void;
  onStop: () => void;
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
  disabled = false,
  variant,
  size = 'lg',
  className
}: VoiceButtonProps) => {
  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
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
  );
};

export default VoiceButton;
