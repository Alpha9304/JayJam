import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LocationState {
  locations: string[]
  addLocation: (newLocation: string) => boolean
  removeLocation: (location: string) => void
  setLocations: (locations: string[]) => void
}

export const useLocationsStore = create<LocationState>()(
  persist(
    (set) => ({
      locations: [], // Initial locations
      addLocation: (newLocation: string) => {
        if (newLocation.trim() === '') {
          return false;
        }
        let wasAdded = false;
        set((state) => {
          if (state.locations.includes(newLocation)) {
            return state; 
          }
          wasAdded = true;
          return { 
            locations: [...state.locations, newLocation] 
          };
        });
        return wasAdded;
      },
      removeLocation: (location: string) =>
        set((state) => ({
          locations: state.locations.filter((l, index) => index !== state.locations.indexOf(location))
        })),
      setLocations: (locations: string[]) => set({ locations }),
    }),
    {
      name: 'locations-storage', // unique name for localStorage
    }
  )
) 