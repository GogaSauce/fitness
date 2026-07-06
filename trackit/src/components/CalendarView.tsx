import { useMemo } from 'react';
import { Calendar } from 'react-native-calendars';
import type { MarkedDates } from 'react-native-calendars/src/types';

import { todayString } from '@/lib/dates';
import { COLORS } from '@/lib/types';

interface Props {
  loggedDates: Set<string>;
  onDayPress: (date: string) => void;
}

export default function CalendarView({ loggedDates, onDayPress }: Props) {
  const today = todayString();

  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};
    for (const date of loggedDates) {
      marks[date] = {
        customStyles: {
          container: { backgroundColor: COLORS.primary, borderRadius: 999 },
          text: { color: '#ffffff', fontWeight: '700' },
        },
      };
    }
    // Today gets a subtle orange ring when nothing is logged yet.
    if (!marks[today]) {
      marks[today] = {
        customStyles: {
          container: {
            borderWidth: 1.5,
            borderColor: COLORS.primary,
            borderRadius: 999,
          },
          text: { color: COLORS.primary },
        },
      };
    }
    return marks;
  }, [loggedDates, today]);

  return (
    <Calendar
      markingType="custom"
      markedDates={markedDates}
      onDayPress={(day) => onDayPress(day.dateString)}
      enableSwipeMonths
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        paddingBottom: 8,
      }}
      theme={{
        calendarBackground: COLORS.card,
        monthTextColor: COLORS.textPrimary,
        textMonthFontWeight: '600',
        dayTextColor: COLORS.textPrimary,
        textDisabledColor: '#4b5563',
        textSectionTitleColor: COLORS.textSecondary,
        todayTextColor: COLORS.primary,
        arrowColor: COLORS.primary,
        textDayFontSize: 15,
      }}
    />
  );
}
