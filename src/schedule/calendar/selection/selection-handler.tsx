import { FC } from 'react';
import { useDraftReservation } from '../providers/draft-reservation-provider';
import { useScheduleContext } from '../providers/schedule-query-provider';
import { GridSelection } from '../selection';

export const SelectionHandler: FC = () => {
  const { setDraftReservation } = useDraftReservation();
  const { venue } = useScheduleContext();

  return (
    <GridSelection
      spaceCount={venue.spaces.length}
      onSelectionComplete={(start, end, spaceIndex) => {
        setDraftReservation({
          id: "draft",
          spaceId: venue.spaces[spaceIndex].id,
          startTime: start,
          endTime: end,
          status: "PENDING",
          userId: "1",
          createdAt: new Date(),
          updatedAt: new Date(),
          description: "Draft reservation",
        });
      }}
    />
  );
}; 