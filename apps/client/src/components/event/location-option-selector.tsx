import { useLocationsStore } from "@/store/locations-store";
import OptionSelector from "../option-selector";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";

interface CreateLocationInputProps {
    onAddLocation: (location: string) => void;
    onClose: () => void;
}

const CreateLocationInput = ({ onAddLocation, onClose }: CreateLocationInputProps) => {
    const [value, setValue] = useState("");
    return (
        <div className="space-y-4">
            <Input 
                placeholder="Enter location" 
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <Button 
                onClick={() => {
                    if (value.trim()) {
                        onAddLocation(value.trim());
                        setValue("");
                        onClose();
                    }
                }}
                className="w-full"
            >
                Add Location
            </Button>
        </div>
    )
}

interface LocationOptionSelectorProps {
    locations: string[];
    onChange?: (locations: string[]) => void;
}

export default function LocationOptionSelector({ locations = [], onChange }: LocationOptionSelectorProps) {
    const { addLocation, removeLocation } = useLocationsStore();

    const handleAddLocation = (location: string) => {
        // Check if location already exists
        if (locations.includes(location)) {
            return; // Don't add duplicate location
        }
        
        addLocation(location);
        onChange?.([...locations, location]);
    };

    const handleRemoveLocation = (location: string) => {
        removeLocation(location);
        onChange?.(locations.filter(l => l !== location));
    };

    return (
        <div>
            <OptionSelector 
                options={locations}
                addOptionTitle="Add Location"
                dialogContent={(closeDialog) => (
                    <CreateLocationInput 
                        onAddLocation={handleAddLocation} 
                        onClose={closeDialog}
                    />
                )}
                onAddOption={handleAddLocation}
                onDeleteOption={handleRemoveLocation}
                maxOptions={5}
            />
        </div>
    )
}