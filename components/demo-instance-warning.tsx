"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export function DemoInstanceWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [nextFlushTime, setNextFlushTime] = useState('');
  
  useEffect(() => {
    // Check if this is a demo instance
    const isDemoInstance = process.env.NEXT_PUBLIC_DEMO_INSTANCE === 'true';
    setShowWarning(isDemoInstance);
    
    if (isDemoInstance) {
      // Calculate the next flush time (every 30 minutes: XX:00 and XX:30)
      const updateNextFlushTime = () => {
        const now = new Date();
        const minutes = now.getMinutes();
        const hours = now.getHours();
        
        // Calculate next flush time
        let nextFlushMinutes = minutes < 30 ? 30 : 0;
        let nextFlushHours = minutes < 30 ? hours : (hours + 1) % 24;
        
        // Format the time as HH:MM
        const formattedHours = nextFlushHours.toString().padStart(2, '0');
        const formattedMinutes = nextFlushMinutes.toString().padStart(2, '0');
        setNextFlushTime(`${formattedHours}:${formattedMinutes}`);
      };
      
      // Update the next flush time immediately and then every minute
      updateNextFlushTime();
      const intervalId = setInterval(updateNextFlushTime, 60000);
      
      return () => clearInterval(intervalId);
    }
  }, []);
  
  if (!showWarning) {
    return null;
  }
  
  return (
    <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950/30 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
        <div>
          <h3 className="mb-1 text-lg font-medium text-red-700 dark:text-red-400">Demo Instance</h3>
          <p className="text-sm text-red-600 dark:text-red-300">
            This is a demo instance. All data will be deleted every half hour. 
            <span className="font-semibold"> Next data flush at {nextFlushTime}</span>.
          </p>
        </div>
      </div>
    </div>
  );
} 