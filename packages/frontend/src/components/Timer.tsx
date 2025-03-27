import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

// Extracted TimeDigit to be outside the main component
const TimeDigit = ({
  value,
  isExpired,
  isUrgent,
  className = '',
}: {
  value: string;
  isExpired: boolean;
  isUrgent: boolean;
  className?: string;
}) => (
  <div className='flex items-center'>
    <div
      className={`flex items-center justify-center font-mono font-bold ${
        className ||
        (isExpired
          ? 'text-gray-500'
          : isUrgent
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-400')
      } ${isUrgent && !isExpired ? 'animate-pulse' : ''}`}
    >
      {value}
    </div>
  </div>
);

type CountdownTimerProps = {
  closesAt: string | Date | number;
  displayText?: boolean;
  containerClassName?: string;
  digitClassName?: string;
  colonClassName?: string;
  wrapperClassName?: string;
  showClockIcon?: boolean;
  clockIconClassName?: string;
  clockIconSize?: number;
};

const CountdownTimer = ({
  closesAt,
  containerClassName = 'flex flex-col items-end',
  digitClassName = '',
  colonClassName = '',
  wrapperClassName = 'flex justify-center',
  showClockIcon = true,
  clockIconClassName = 'mr-1 text-gray-500 dark:text-gray-400',
  clockIconSize = 16,
}: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState({ hours: '--', minutes: '--', seconds: '--' });
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      try {
        const now = new Date();
        const closingTime = new Date(closesAt);

        // Handle invalid date
        if (isNaN(closingTime.getTime())) {
          setTimeRemaining({ hours: '--', minutes: '--', seconds: '--' });
          return;
        }

        const diff = closingTime.getTime() - now.getTime();

        // Handle expired case
        if (diff <= 0) {
          setTimeRemaining({ hours: '00', minutes: '00', seconds: '00' });
          setIsExpired(true);
          return;
        }

        // Set urgent flag for less than 6 hours
        setIsUrgent(diff < 6 * 60 * 60 * 1000);

        // Calculate time components
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Format with leading zeros
        setTimeRemaining({
          hours: hours.toString().padStart(2, '0'),
          minutes: minutes.toString().padStart(2, '0'),
          seconds: seconds.toString().padStart(2, '0'),
        });
      } catch (error) {
        console.error('Error calculating time:', error);
        setTimeRemaining({ hours: '--', minutes: '--', seconds: '--' });
      }
    };

    calculateTimeRemaining();
    const timerId = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(timerId);
  }, [closesAt]);

  const colonStyle = `flex items-center ${colonClassName || 'text-gray-500'}`;

  return (
    <div className={containerClassName}>
      <div className={wrapperClassName}>
        {showClockIcon && <Clock size={clockIconSize} className={clockIconClassName} />}
        <TimeDigit
          value={timeRemaining.hours}
          isExpired={isExpired}
          isUrgent={isUrgent}
          className={digitClassName}
        />
        <div className={colonStyle}>:</div>
        <TimeDigit
          value={timeRemaining.minutes}
          isExpired={isExpired}
          isUrgent={isUrgent}
          className={digitClassName}
        />
        <div className={colonStyle}>:</div>
        <TimeDigit
          value={timeRemaining.seconds}
          isExpired={isExpired}
          isUrgent={isUrgent}
          className={digitClassName}
        />
      </div>
    </div>
  );
};

export default CountdownTimer;
