import { Car } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DrivingModeOverlayProps {
  speed: number;
  propertiesCount: number;
}

export const DrivingModeOverlay = ({ speed, propertiesCount }: DrivingModeOverlayProps) => {
  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center">
      {/* Ícono de carro animado */}
      <div className="relative mb-8">
        {/* Círculo pulsante de fondo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-primary/20 animate-ping" 
               style={{ animationDuration: '2s' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-primary/30 animate-pulse" />
        </div>
        
        {/* Ícono del carro */}
        <div className="relative z-10 w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-2xl">
          <Car className="w-14 h-14 text-primary-foreground animate-bounce" 
               style={{ animationDuration: '1.5s' }} />
        </div>
      </div>

      {/* Información */}
      <Card className="p-6 text-center max-w-sm mx-4 border-primary/20">
        <h2 className="text-2xl font-bold mb-2">Modo Conducción Activo</h2>
        <p className="text-muted-foreground mb-4">
          Pantalla bloqueada por seguridad
        </p>
        
        <div className="flex justify-around items-center gap-6 mt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {Math.round(speed)}
            </div>
            <div className="text-sm text-muted-foreground">km/h</div>
          </div>
          
          <div className="h-12 w-px bg-border" />
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {propertiesCount}
            </div>
            <div className="text-sm text-muted-foreground">Guardadas</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Reduce la velocidad por debajo de 20 km/h para revisar las propiedades
        </p>
      </Card>

      {/* Indicador de velocidad pulsante */}
      <div className="mt-8 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" 
             style={{ animationDelay: '0.3s' }} />
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" 
             style={{ animationDelay: '0.6s' }} />
      </div>
    </div>
  );
};
