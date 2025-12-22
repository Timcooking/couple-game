
import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  duration: number;
}

const Timer: React.FC<TimerProps> = ({ duration }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);
  
  const endSoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    // Preload audio
    endSoundRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
  }, [])


  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsActive(false);
      endSoundRef.current?.play();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const handleStart = () => {
    if (timeLeft > 0) {
      setIsActive(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center gap-4 p-2 rounded-xl bg-black/40">
      <div className="text-4xl font-bold tabular-nums text-white">
        {formatTime(timeLeft)}
      </div>
      {!isActive && timeLeft > 0 && (
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-500 transition-colors"
        >
          启动
        </button>
      )}
      {isActive && (
         <div className="text-lg text-green-300">计时中...</div>
      )}
      {timeLeft === 0 && (
         <div className="text-lg text-yellow-300 font-bold">时间到!</div>
      )}
    </div>
  );
};

export default Timer;
