import { useState, useEffect, useRef, memo } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  startTime: Date;
  className?: string;
}

const TimerComponent = ({ startTime, className = "" }: TimerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateElapsedTime = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    };

    updateElapsedTime();
    intervalRef.current = setInterval(updateElapsedTime, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className={`px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-400/20 border border-purple-400/30 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-2 ${className}`}>
      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-700" />
      <span className="text-xs font-medium text-purple-700">{formatTime(elapsedTime)}</span>
    </div>
  );
};

export const Timer = memo(TimerComponent);