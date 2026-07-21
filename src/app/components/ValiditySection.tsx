import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateFormatter';
import { Calendar, Pencil } from 'lucide-react';

interface ValiditySectionProps {
  title: string;
  fromDate?: string;
  toDate?: string;
  onAddDates: () => void;
  onEdit: () => void;
}

export const ValiditySection: React.FC<ValiditySectionProps> = ({
  title,
  fromDate,
  toDate,
  onAddDates,
  onEdit,
}) => {
  const { t, language } = useApp();

  // Calculate progress and status
  const calculateProgress = () => {
    if (!fromDate || !toDate) return null;

    const now = new Date();
    const start = new Date(fromDate);
    const end = new Date(toDate);

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const remaining = end.getTime() - now.getTime();
    const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));

    // Progress is how much time has passed (inverted for visual: full = just started)
    const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    let status: 'active' | 'warning' | 'expired';
    if (daysRemaining < 0) {
      status = 'expired';
    } else if (daysRemaining <= 30) {
      status = 'warning';
    } else {
      status = 'active';
    }

    return {
      progress: 100 - progressPercent, // Invert so full = valid, empty = expired
      daysRemaining,
      status,
    };
  };

  const progressData = calculateProgress();

  // Convert Persian/Arabic numerals to English for display formatting
  const convertToEnglishNumber = (str: string): string => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicNumbers = ['٠', '٢', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let result = str;
    
    persianNumbers.forEach((num, idx) => {
      result = result.replace(new RegExp(num, 'g'), idx.toString());
    });
    
    arabicNumbers.forEach((num, idx) => {
      result = result.replace(new RegExp(num, 'g'), idx.toString());
    });
    
    return result;
  };

  const formatNumber = (num: number): string => {
    if (language === 'fa') {
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return num.toString().split('').map(d => persianDigits[parseInt(d)] || d).join('');
    }
    return num.toString();
  };

  const getProgressColor = () => {
    if (!progressData) return 'bg-muted';
    
    switch (progressData.status) {
      case 'expired':
        return 'bg-destructive';
      case 'warning':
        return 'bg-yellow-500';
      case 'active':
        return 'bg-primary';
      default:
        return 'bg-muted';
    }
  };

  const getTextColor = () => {
    if (!progressData) return 'text-muted-foreground';
    
    switch (progressData.status) {
      case 'expired':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-500';
      case 'active':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="rounded-xl bg-secondary border border-border/70/50 p-3 space-y-3">
      {/* Title with Edit Button and Status */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        
        <div className="flex items-center gap-2">
          {fromDate && toDate && (
            <button
              onClick={onEdit}
              className="h-7 w-7 rounded-xl bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
              aria-label="Edit dates"
            >
              <Pencil className="h-4 w-4 text-foreground" />
            </button>
          )}
          
          {progressData && progressData.status === 'expired' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
              {t('expired')}
            </span>
          )}
        </div>
      </div>

      {fromDate && toDate ? (
        <>
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-1">{t('from')}</p>
              <p className="text-foreground font-medium">{formatDate(fromDate, language)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">{t('to')}</p>
              <p className="text-foreground font-medium">{formatDate(toDate, language)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {progressData && (
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getProgressColor()}`}
                  style={{ width: `${progressData.progress}%` }}
                />
              </div>
              
              {/* Status Text */}
              {progressData.status !== 'expired' && (
                <p className={`text-xs ${getTextColor()}`}>
                  {formatNumber(progressData.daysRemaining)} {t('daysRemaining')}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <button
          onClick={onAddDates}
          className="w-full py-2.5 border border-dashed border-border/70 rounded-xl text-xs text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="h-3.5 w-3.5" />
          {t('addDates')}
        </button>
      )}
    </div>
  );
};