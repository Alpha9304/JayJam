import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TimeSlotState {
  timeSlots: string[]
  addTimeSlot: (newTimeSlot: string) => boolean
  removeTimeSlot: (timeSlot: string) => void
  setTimeSlots: (timeSlots: string[]) => void
}

export const useTimeSlotStore = create<TimeSlotState>()(
  persist(
    (set) => ({
      timeSlots: [],
      addTimeSlot: (newTimeSlot: string) => {
        if (newTimeSlot.trim() === '') {
          return false;
        }
        let wasAdded = false;
        set((state) => {
          if (state.timeSlots.includes(newTimeSlot)) {
            return state; 
          }
          wasAdded = true;
          return { 
            timeSlots: [...state.timeSlots, newTimeSlot] 
          };
        });
        console.log("timeSlots: " + newTimeSlot);
        return wasAdded;
      },
      removeTimeSlot: (timeSlot: string) =>
        set((state) => ({
          timeSlots: state.timeSlots.filter((t, index) => index !== state.timeSlots.indexOf(timeSlot))
        })),
      setTimeSlots: (timeSlots: string[]) => set({ timeSlots }),
    }),
    {
      name: 'time-slots-storage', // unique name for localStorage
    }
  )
)
