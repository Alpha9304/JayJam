//helper function to compare intervals
const compareIntervals = (intervalOne: [Date, Date], intervalTwo: [Date, Date]): number => {
    if (intervalOne[0] < intervalTwo[0]) {
        return -1;
    } else if (intervalOne[0] > intervalTwo[0]) {
        return 1;
    } else {
        if (intervalOne[1] < intervalTwo[1]) {
            return -1;
        } else if (intervalOne[1] > intervalTwo[1]) {
            return 1;
        } else {
            return 0;
        }
    }
}


//helper function to calculate overlapping intervals between interval lists
const findOverlaps = (intervalsI: [Date, Date][], intervalsJ: [Date, Date][]): [Date, Date][] => {
    const overlaps: [Date, Date][] = [];
    let i = 0;
    let j = 0;
    while (i < intervalsI.length && j < intervalsJ.length) {
        let A: [Date, Date];
        let B: [Date, Date];

        let iIsA: boolean = false;
        //set A as the earliest starting interval, always
        if(intervalsI[i][0] <= intervalsJ[j][0]) {
            A = intervalsI[i];
            B = intervalsJ[j];
            iIsA = true;
        } else {
            B = intervalsI[i];
            A = intervalsJ[j];
        }

        //overlap if this happens
        if(A[1] >= B[0]) {
            if(A[1] < B[1]) { //push the min
                overlaps.push([B[0], A[1]])
            } else {
                overlaps.push([B[0], B[1]])
            }

        }


        //move to next interval for interval that ends first
        if(A[1] < B[1]) {
            if(iIsA) {
                i++;
            } else {
                j++;
            }
        } else {
            if(!iIsA) {
                i++;
            } else {
                j++;
            }
        }
    }

    return overlaps;
}

const calcNewAvailable = (oldAvailable: [Date, Date][], invalidTimes: [Date, Date][]): [Date, Date][] => {
    const newAvailable: [Date, Date][] = [];
    let i = 0;
    let j = 0;

    while(i < oldAvailable.length && j < invalidTimes.length) {
        //invalid time starts inside the old available times
        if(oldAvailable[i][0] <= invalidTimes[j][0]) {
            //invalid time is completely inside of available
            if(invalidTimes[j][1] <= oldAvailable[i][1]) {
                const invalidDateStartMinus = new Date(invalidTimes[j][0]);
                invalidDateStartMinus.setMinutes(invalidDateStartMinus.getMinutes() - 1);

                const invalidDateStartPlus = new Date(invalidTimes[j][0]);
                invalidDateStartPlus.setMinutes(invalidDateStartPlus.getMinutes() + 1);

                if(oldAvailable[i][0] < invalidDateStartMinus) {
                    newAvailable.push([oldAvailable[i][0], invalidDateStartMinus]) //[oldStart, invalidStart - 1 minute]
                }

                //move oldAvailable forward
                if(j + 1 < invalidTimes.length) {
                    const invalidDateEndPlus = new Date(invalidTimes[j][1]);
                    invalidDateEndPlus.setMinutes(invalidDateEndPlus.getMinutes() + 1);
                    oldAvailable[i][0] = invalidDateEndPlus;
                } else {
                    const invalidDateEndPlus = new Date(invalidTimes[j][1]);
                    invalidDateEndPlus.setMinutes(invalidDateEndPlus.getMinutes() + 1);
                    if(oldAvailable[i][1] > invalidDateEndPlus) {
                        newAvailable.push([invalidDateEndPlus, oldAvailable[i][1]]); //!!!
                    }
                }
            //end of invalid time is outside of available
            } else if(oldAvailable[i][0] > invalidTimes[j][0]) {
                const invalidDateStartMinus = new Date(invalidTimes[j][0]);
                invalidDateStartMinus.setMinutes(invalidDateStartMinus.getMinutes() - 1);
                newAvailable.push([oldAvailable[i][0], invalidDateStartMinus]) //[oldStart, invalidStart - 1 minute]
            }
        } else {
            //only do something if oldAvailable is not completely in an invalid interval
            if(oldAvailable[i][1] > invalidTimes[j][1]) { //actually this won't happen because it is not in overlap?; leave it just in case
                const invalidDateEndPlus = new Date(invalidTimes[j][1]);
                invalidDateEndPlus.setMinutes(invalidDateEndPlus.getMinutes() + 1);
                newAvailable.push([invalidDateEndPlus, oldAvailable[i][1]]); //[invalidEnd + 1, oldEnd]
            }
        }

        //move to next interval for interval that ends first
        if (oldAvailable[i][1] < invalidTimes[j][1]) {
            i++;
        } else {
            j++;
        }
    }

    return newAvailable;
}



//helper function to sort intervals by start date
const sortIntervals = (intervals: [Date, Date][]): [Date, Date][] => {
    intervals.sort(compareIntervals);
    return intervals;
}

//Function to calculate suggested meeting times
//Precondition: existing times will only be within the entered start and end date range
//Precondition: intervals have start <= end always
//Precondition: either argument is not an empty list (the creator student always has class events, and the event field for the start and end date must be filled by the creator)
//existingTimes: the users in the events' existingEvent times 

export const calcSuggestion = ( existingTimes: [Date, Date][], enteredStartEnd: [Date, Date]) : [Date, Date][] => { //you can compare Dates directly! convert timestamp to date when passed in
    const timeIntervals: [Date, Date][] = sortIntervals(existingTimes);

    //start with largest possible available interval, which is the current proposed one for the event; made to handle more intervals bc of my original idea...and maybe it could change?
    let availableIntervals: [Date, Date][] = [enteredStartEnd];

    //get overlapping intervals and make them disjoint

    //get overlapping intervals
    let overlaps: [Date, Date][] = findOverlaps(timeIntervals, availableIntervals);
    overlaps = mergeOverlaps(overlaps);

    if(overlaps.length == 0){ //no overlap means all available
        return availableIntervals;
    }

    //suggestions is the available intervals minus the overlaps
    const suggestedTimeIntervals: [Date, Date][] = calcNewAvailable(availableIntervals, overlaps);

    return suggestedTimeIntervals;


}

//helper function to merge overlapping intervals within an interval list
const mergeOverlaps = (intervals: [Date, Date][]): [Date, Date][] => {
    if(intervals.length == 0) {
        return [];
    }
    const merged: [Date, Date][] = [intervals[0]];
    for(let i = 1; i < intervals.length; i++) {
        const inside = merged[merged.length - 1];
        if(inside[1] < intervals[i][0]) { //no overlap
            merged.push(intervals[i]);
        } else { //overlap
            if(inside[1] > intervals[i][1]) {
                merged[merged.length - 1] = [inside[0], inside[1]]; //use max end
            } else {
                merged[merged.length - 1] = [inside[0], intervals[i][1]];
            }

        }
    }

    return merged;
}

// Merge overlapping time interval objects from Google data
export const mergeBusyOverlaps = (intervals: { start: Date, end: Date }[]): [Date, Date][] => {
    if (!intervals) return [];

    // Sort intervals by starting time then convert object intervals to list intervals
    const sortedIntervals: [Date, Date][] = [...intervals].sort((a, b) => compareIntervals([a.start, a.end], [b.start, b.end]))
        .map(({ start, end }) => [start, end])

    const mergedIntervals: [Date, Date][] = []
    let currentInterval: [Date, Date] = sortedIntervals[0]

    for (let i = 1; i < sortedIntervals.length; i++) {

        const nextInterval = sortedIntervals[i]

        if (currentInterval[1] >= nextInterval[0]) { // If current end overlaps with next beginning...
            // Combine intervals
            currentInterval[1] = new Date(Math.max(currentInterval[1].getTime(), nextInterval[1].getTime()))
        } else { // No more overlaps, push
            mergedIntervals.push(currentInterval)
            currentInterval = nextInterval;
        }
    }

    mergedIntervals.push(currentInterval) // Add last interval

    return mergedIntervals
}
