import * as ical from 'node-ical';
import { VEvent } from 'node-ical';

// Defines return type of parseCalendar(url, startDate, endDate)
interface studentInfo {
	userId: string;
	schedule: {[className: string]: classSchedule}
}

// Defines structure of "schedule" property in studentInfo
interface classSchedule {
	classId: string;
	sectionNumber: string;
	classEvents: VEvent[];
}

/*
	parseCalendar
	Extracts user id and schedule information (class name, class id, section numbers, meeting times).

	Params:
	- url: SIS iCal url
	- startDate: first day of a semester
	- endDate: last day of a semester

	Returns:
	- Student information in the form:
	{
		userId: string,
		schedule: {
			className: {
				classId: string,
				sectionNumber: string,
				classEvents: VEvent[] (actual event objects from .ics file)
			}
		}
	}
*/
export const parseCalendar  = async (url : string, startDate: Date, endDate: Date) : Promise<studentInfo> => {
	try {
		// download events from iCal link
		const events = await ical.async.fromURL(`${url}`);

		// only get events starting from startDate to endDate
		const filteredEvents = Object
			.values(events)
			.filter(event => {
				if (event.type !== "VEVENT" || !event.start) return false;

				const eventDate = new Date(event.start);
				return (eventDate >= startDate) && (eventDate <= endDate);
			});
		
		// extract user id
		const firstEvent = Object.values(filteredEvents)[0] as VEvent;
		const userId = firstEvent?.uid.split("@")[0];

		// extract schedule
		const schedule: { [key: string]: classSchedule } = {};
		Object
			.values(filteredEvents)
			.forEach(event => {
				if (event.type === "VEVENT") {
					const className = event.summary.split(" - ")[1];

					if (!(`${className}` in schedule)) { // if newly-encountered class
						const classId = event.summary.split(" (")[0];
						const sectionNumber = event.summary.split("(")[1].split(")")[0];

						schedule[`${className}`] = {
							classId: classId,
							sectionNumber: sectionNumber,
							classEvents: [event]
						};

					} else { // else already-encountered class
						schedule[`${className}`].classEvents.push(event);
					}
				}
			})
		console.log("this is from the calendar script: ", schedule);
		
		return {
			userId: userId,
			schedule: schedule
		}
	} catch (error) {
		console.log("Error occurred:", error);

		return {
			userId: "",
			schedule: {}
		}
	}
}