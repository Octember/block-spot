import { createEvents } from 'ics';
import { Reservation, Space } from "wasp/entities";
import { HttpError } from "wasp/server";
import { ExportCalendar } from 'wasp/server/api';

type ExportCalendarPayload = {
  venueId: string;
};


export const exportCalendar: ExportCalendar<ExportCalendarPayload, string> = async (req, res, context) => {
  // Get venue info
  const { venueId } = req.query as ExportCalendarPayload;

  const venue = await context.entities.Venue.findFirst({
    where: {
      id: venueId,
    },
    include: {
      spaces: {
        include: {
          reservations: {
            where: {
              status: "CONFIRMED",
              startTime: {
                gte: new Date(),
              },
            },
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!venue) {
    throw new HttpError(404, "Venue not found");
  }

  // Convert reservations to ICS events
  const events = venue.spaces.flatMap((space: Space & { reservations: Reservation[] }) =>
    space.reservations.map((reservation: Reservation) => ({
      start: [
        reservation.startTime.getFullYear(),
        reservation.startTime.getMonth() + 1,
        reservation.startTime.getDate(),
        reservation.startTime.getHours(),
        reservation.startTime.getMinutes(),
      ],
      end: [
        reservation.endTime.getFullYear(),
        reservation.endTime.getMonth() + 1,
        reservation.endTime.getDate(),
        reservation.endTime.getHours(),
        reservation.endTime.getMinutes(),
      ],
      title: `${space.name}: ${reservation.description || 'Reserved'}`,
      description: `Reservation at ${venue.name} - ${space.name}`,
      location: venue.address,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
    }))
  );

  // Generate ICS file
  const { error, value } = createEvents(events);

  if (error || !value) {
    throw new HttpError(500, "Failed to generate calendar");
  }

  // Set response headers for file download
  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename="${venue.name}-calendar.ics"`);
  
  // Send the ICS file
  res.send(value);
}; 