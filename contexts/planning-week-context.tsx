import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type PlanningWeekContextValue = {
  selectedDay: string;
  setSelectedDay: React.Dispatch<React.SetStateAction<string>>;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  weekOffset: number;
};

const PlanningWeekContext = createContext<PlanningWeekContextValue | null>(null);

export function PlanningWeekProvider({ children }: { children: ReactNode }) {
  const [selectedDay, setSelectedDay] = useState('Lundi');
  const [weekOffset, setWeekOffset] = useState(0);
  const value = useMemo(
    () => ({
      selectedDay,
      setSelectedDay,
      setWeekOffset,
      weekOffset,
    }),
    [selectedDay, weekOffset]
  );

  return (
    <PlanningWeekContext.Provider value={value}>
      {children}
    </PlanningWeekContext.Provider>
  );
}

export function usePlanningWeek() {
  const context = useContext(PlanningWeekContext);

  if (!context) {
    throw new Error('usePlanningWeek must be used inside PlanningWeekProvider');
  }

  return context;
}
