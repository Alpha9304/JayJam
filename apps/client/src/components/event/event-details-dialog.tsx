import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetLocationOptions } from "@/hooks/event/use-get-location-options";
import { useGetTimeOptions } from "@/hooks/event/use-get-time-options";
import { useVoteLocation } from "@/hooks/event/use-vote-location";
import { useVoteTime } from "@/hooks/event/use-vote-time";
import { CalendarClockIcon, MapPinIcon } from "lucide-react";

interface LocationOption {
  id: number;
  location: string;
  locationVoteCount: number;
  hasVoted: boolean;
}

interface TimeOption {
  id: number;
  startTime: string;
  endTime: string;
  timeVoteCount: number;
  hasVoted: boolean;
}

interface EventDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  title: string;
}

export function EventDetailsDialog({
  isOpen,
  onClose,
  eventId,
  title,
}: EventDetailsDialogProps) {
  const { locationOptions, isLoading: isLoadingLocations } = useGetLocationOptions(eventId);
  const { timeOptions, isLoading: isLoadingTimes } = useGetTimeOptions(eventId);
  const { voteLocation, unvoteLocation } = useVoteLocation();
  const { voteTime, unvoteTime } = useVoteTime();

  const handleVoteLocation = async (optionId: number, optionHasVoted: boolean) => {
    try {
      if (!optionHasVoted) {
        await voteLocation({ eventId, optionId });
      } else {
        await unvoteLocation({ optionId })
      }
    } catch (error) {
      console.error("Failed to vote/unvote for location:", error);
    }
  };

  const handleVoteTime = async (optionId: number, optionHasVoted: boolean) => {
    try {
      if (!optionHasVoted) {
        await voteTime({ eventId, optionId });
      } else {
        await unvoteTime({optionId})
      }
    } catch (error) {
      console.error("Failed to vote/unvote for time:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPinIcon className="h-5 w-5" />
              Location Options
            </h3>
            {isLoadingLocations ? (
              <p>Loading locations...</p>
            ) : locationOptions && locationOptions.length > 0 ? (
              <div className="space-y-2 mt-2">
                {locationOptions.map((option: LocationOption) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div>
                      <p>{option.location}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.locationVoteCount} votes
                      </p>
                    </div>
                    <Button
                      variant={option.hasVoted ?
                        "success" : "outline"}
                      onClick={() => handleVoteLocation(option.id, option.hasVoted)}
                    >
                      {option.hasVoted ? "Voted" : "Vote"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No location options available</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarClockIcon className="h-5 w-5" />
              Time Options
            </h3>
            {isLoadingTimes ? (
              <p>Loading times...</p>
            ) : timeOptions && timeOptions.length > 0 ? (
              <div className="space-y-2 mt-2">
                {timeOptions.map((option: TimeOption) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div>
                      <p>
                        {new Date(option.startTime).toLocaleString()} -{" "}
                        {new Date(option.endTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {option.timeVoteCount} votes
                      </p>
                    </div>
                    <Button
                      variant={option.hasVoted ? "success" : "outline"}
                      onClick={() => handleVoteTime(option.id, option.hasVoted)}
                    >
                      {option.hasVoted ? "Voted" : "Vote"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No time options available</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 