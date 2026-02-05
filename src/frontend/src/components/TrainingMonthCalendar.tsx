import { useState, useMemo, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getIntensityLabel, getIntensityBadgeColor } from '../lib/intensityUtils';
import { formatSessionTheme } from '../lib/formatters';
import { getMoodIcon } from '../lib/moodIcons';
import { useDragToScroll } from '../hooks/useDragToScroll';
import type { TrainingSession } from '../backend';

interface TrainingMonthCalendarProps {
  sessions: TrainingSession[];
  onEditSession?: (session: TrainingSession) => void;
}

export default function TrainingMonthCalendar({ sessions, onEditSession }: TrainingMonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [highlightedSessionId, setHighlightedSessionId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group sessions by date (YYYY-MM-DD)
  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, TrainingSession[]>();
    sessions.forEach((session) => {
      const sessionDate = new Date(Number(session.date) / 1000000);
      const dateKey = format(sessionDate, 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(session);
    });
    return grouped;
  }, [sessions]);

  // Get all sessions for the current month, sorted chronologically (oldest first, newest at bottom)
  const currentMonthSessions = useMemo(() => {
    const monthSessions: Array<{ date: string; session: TrainingSession }> = [];
    
    sessions.forEach((session) => {
      const sessionDate = new Date(Number(session.date) / 1000000);
      if (
        sessionDate.getFullYear() === currentDate.getFullYear() &&
        sessionDate.getMonth() === currentDate.getMonth()
      ) {
        monthSessions.push({
          date: format(sessionDate, 'yyyy-MM-dd'),
          session,
        });
      }
    });

    // Sort chronologically (oldest first)
    monthSessions.sort((a, b) => {
      const dateA = new Date(Number(a.session.date) / 1000000);
      const dateB = new Date(Number(b.session.date) / 1000000);
      return dateA.getTime() - dateB.getTime();
    });

    return monthSessions;
  }, [sessions, currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to determine day cell styling based on training types present
  const getDayCellStyle = (daySessions: TrainingSession[]) => {
    if (daySessions.length === 0) return null;

    const hasGi = daySessions.some((s) => s.trainingType === 'gi');
    const hasNoGi = daySessions.some((s) => s.trainingType === 'noGi');

    if (hasGi && hasNoGi) {
      // Both types: purple
      return {
        border: 'border-[oklch(0.50_0.20_290)]',
        bg: 'bg-[oklch(0.50_0.20_290)]/12',
        ring: 'ring-[oklch(0.50_0.20_290)]',
        showDots: true,
      };
    } else if (hasGi) {
      // Gi only: blue
      return {
        border: 'border-[oklch(0.55_0.18_240)]',
        bg: 'bg-[oklch(0.55_0.18_240)]/12',
        ring: 'ring-[oklch(0.55_0.18_240)]',
        showDots: true,
      };
    } else if (hasNoGi) {
      // No-Gi only: red border, no dots
      return {
        border: 'border-[oklch(0.55_0.22_27)]',
        bg: 'bg-[oklch(0.55_0.22_27)]/12',
        ring: 'ring-[oklch(0.55_0.22_27)]',
        showDots: false,
      };
    }
    return null;
  };

  const detailsScrollRef = useDragToScroll<HTMLDivElement>();
  const sessionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Handle day click: scroll to first session of that date
  const handleDayClick = (dateKey: string) => {
    const daySessions = sessionsByDate.get(dateKey) || [];
    if (daySessions.length === 0) return;

    const firstSessionId = daySessions[0].id;
    const sessionElement = sessionRefs.current.get(firstSessionId);
    
    if (sessionElement && detailsScrollRef.current) {
      sessionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      // Highlight the session temporarily
      setHighlightedSessionId(firstSessionId);
      setTimeout(() => setHighlightedSessionId(null), 2000);
    }
  };

  // Clear refs when month changes
  useEffect(() => {
    sessionRefs.current.clear();
  }, [currentDate]);

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Two-column layout: Calendar + Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid (left side, 2/3 width on large screens) */}
        <Card className="p-3 lg:col-span-2">
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const cellStyle = isCurrentMonth ? getDayCellStyle(daySessions) : null;

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'relative aspect-square p-1 rounded-md border transition-all',
                    isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                    isCurrentMonth && cellStyle?.bg,
                    isCurrentMonth && cellStyle?.border,
                    isCurrentMonth && daySessions.length > 0 && 'cursor-pointer hover:shadow-md'
                  )}
                  onClick={() => isCurrentMonth && handleDayClick(dateKey)}
                  onMouseEnter={(e) => {
                    if (isCurrentMonth && daySessions.length > 0) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.zIndex = '10';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isCurrentMonth) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.zIndex = '1';
                    }
                  }}
                >
                  {/* Day Number */}
                  <div
                    className={cn(
                      'text-xs font-medium mb-0.5',
                      isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Today Badge */}
                  {isToday && (
                    <div className="absolute top-0.5 right-0.5">
                      <span className="text-[7px] font-bold bg-primary text-primary-foreground px-1 py-0.5 rounded">
                        Today
                      </span>
                    </div>
                  )}

                  {/* Session Count Indicator - only for current month and only if showDots is true */}
                  {isCurrentMonth && daySessions.length > 0 && cellStyle?.showDots && (
                    <div className="flex items-center justify-center mt-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(daySessions.length, 3) }).map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              cellStyle?.border.replace('border-', 'bg-') || 'bg-muted-foreground'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Details Panel (right side, 1/3 width on large screens) */}
        <Card className="p-4 lg:col-span-1">
          <div className="space-y-3 h-full flex flex-col">
            <h4 className="text-sm font-bold text-primary">
              {format(currentDate, 'MMMM yyyy')} Sessions
            </h4>
            
            {currentMonthSessions.length > 0 ? (
              <div
                ref={detailsScrollRef}
                className="space-y-2 flex-1 overflow-y-auto pr-2 minimal-scrollbar"
                style={{ maxHeight: '500px' }}
              >
                {currentMonthSessions.map(({ date, session }, idx) => {
                  const isHighlighted = highlightedSessionId === session.id;
                  const moodIcon = getMoodIcon(session.moodRating);
                  
                  return (
                    <div
                      key={idx}
                      ref={(el) => {
                        if (el) {
                          sessionRefs.current.set(session.id, el);
                        }
                      }}
                      className={cn(
                        'p-2 rounded border space-y-1.5 transition-all',
                        isHighlighted
                          ? 'bg-primary/10 border-primary ring-2 ring-primary'
                          : 'bg-muted/50 border-border hover:bg-muted/70'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {format(new Date(date), 'MMM d')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              session.trainingType === 'gi'
                                ? 'bg-bjj-blue/10 text-bjj-blue border-bjj-blue'
                                : 'bg-[oklch(0.55_0.22_27)]/10 text-[oklch(0.55_0.22_27)] border-[oklch(0.55_0.22_27)]'
                            )}
                          >
                            {session.trainingType === 'gi' ? 'Gi' : 'No-Gi'}
                          </Badge>
                          {onEditSession && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditSession(session);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium">
                          {Number(session.rolls)} rolls
                        </span>
                        <span>•</span>
                        <span>
                          {(Number(session.duration) / 60).toFixed(1)}h
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getIntensityBadgeColor(session.intensity))}
                        >
                          {getIntensityLabel(session.intensity)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatSessionTheme(session.sessionTheme)}
                        </Badge>
                        {/* Mood Icon */}
                        <div className="flex items-center gap-1">
                          <img
                            src={moodIcon.src}
                            alt={moodIcon.alt}
                            className="w-5 h-5"
                            title={moodIcon.alt}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
                No sessions this month
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-bjj-blue" />
          <span>Gi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[oklch(0.55_0.22_27)]" />
          <span>No-Gi</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Click days to jump to sessions</span>
        </div>
      </div>
    </div>
  );
}
