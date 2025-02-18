import { Controller, FormProvider, useForm, useFormContext, } from "react-hook-form";
import { FormField } from "../../../../client/components/form/form-field";
import { Modal } from "../../../../client/components/modal";
import { usePendingChanges } from "../../providers/pending-changes-provider";

import { FC } from "react";
import { createReservation } from "wasp/client/operations";
import { Reservation } from "wasp/entities";
import { Select } from "../../../../client/components/form/select";
import { TextInput } from "../../../../client/components/form/text-input";
import { useToast } from "../../../../client/toast";
import { useScheduleContext } from "../../providers/schedule-context-provider";
import { useVenueContext } from "../../providers/venue-provider";
import { UpdateReservationActionButtons } from "../components/action-buttons";
import { DateInput } from "../components/date-input";
import { TimeRangeSelect } from "../components/time-range-select";
import { CreateReservationFormInputs } from "./types";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { LuCheck, LuSearch } from "react-icons/lu";
import { UserAvatar } from '../../../../client/components/user-avatar';

function timeToMinutes(time: Date) {
  return time.getHours() * 60 + time.getMinutes();
}

function minutesToTime(date: Date, minutes: number) {
  const newDate = new Date(date);
  newDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return newDate;
}

export const CreateReservationModal: FC<{
  reservation: Reservation;
}> = ({ reservation }) => {
  const { cancelChange } = usePendingChanges();
  const { venue, getSpaceById } = useVenueContext();
  const { refresh } = useScheduleContext();
  const toast = useToast();
  const { isAdmin } = useAuthUser();

  const form = useForm<CreateReservationFormInputs>({
    defaultValues: {
      date: reservation.startTime,
      startTimeMinutes: timeToMinutes(reservation.startTime),
      endTimeMinutes: timeToMinutes(reservation.endTime),
      title: reservation.description ?? "",
      spaceId: reservation.spaceId,
    },
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, submitCount },
  } = form;

  const startTimeMinutes = watch("startTimeMinutes");
  const endTimeMinutes = watch("endTimeMinutes");

  async function onSubmit(data: CreateReservationFormInputs) {
    await createReservation({
      startTime: minutesToTime(data.date, data.startTimeMinutes),
      endTime: minutesToTime(data.date, data.endTimeMinutes),
      description: data.title,
      spaceId: data.spaceId,
    });

    refresh();
    toast({
      title: "Reservation created",
      description: "The reservation has been created",
    });

    setTimeout(() => {
      cancelChange();
    }, 300);
  }

  const enableUserSection = isAdmin;

  return (
    <Modal
      className="flex"
      open={true}
      size="xl"
      onClose={() => cancelChange()}
      heading={{ title: "New Reservation" }}
      footer={
        <UpdateReservationActionButtons
          onCancel={cancelChange}
          onClick={handleSubmit(onSubmit)}
          isLoading={isSubmitting || submitCount > 0}
        />
      }
    >
      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`grid ${enableUserSection ? "md:grid-cols-2" : ""} grid-cols-1 gap-12`}
        >
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Date & Time</h2>
            <FormField label="Date" required>
              <DateInput
                startTimeMinutes={startTimeMinutes}
                endTimeMinutes={endTimeMinutes}
                reservation={reservation}
              />
            </FormField>

            <TimeRangeSelect />

            <FormField label="Space" required>
              <Controller
                name="spaceId"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Select
                    options={venue.spaces.map((space) => ({
                      label: space.name,
                      value: space.id,
                    }))}
                    value={{
                      label: getSpaceById(value)?.name || "",
                      value: value,
                    }}
                    onChange={(value) => {
                      onChange(value.value);
                    }}
                  />
                )}
              />
            </FormField>

            <FormField label="Reservation Title">
              <TextInput {...register("title")} />
            </FormField>
          </div>

          {enableUserSection && (
            <UpdateReservationUserSection />
          )}
        </form>
      </FormProvider>
    </Modal >
  );
};


const UpdateReservationUserSection = () => {
  const users = [{
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
  }, {
    id: "2",
    name: "Jane Doe",
    email: "jane.doe@example.com",
  }]

  const { register } = useFormContext<CreateReservationFormInputs>();

  return <div className="flex flex-col gap-4">
    <div className="flex flex-row gap-x-2 items-center">
      <h2 className="text-xl font-semibold">User</h2>
      <span className="text-sm font-normal text-gray-500">optional</span>
    </div>

    <TextInput
      placeholder="Search for a user..."
      {...register("user")}
      // @ts-expect-error No idea why this is not working
      size="lg"
      icon={<LuSearch className="size-6" />}
    />


    <ul className="flex flex-col gap-y-2 p-2 rounded-md border border-gray-400">
      {users.map((user, i) => (
        <UserListItem key={user.id} user={user} selected={i % 2 === 0} />
      ))}
    </ul>
  </div>
}

const UserListItem = ({ user, selected }: { user: { id: string, name: string, email: string }, selected: boolean }) => {
  return <li className={`flex rounded-md hover:bg-gray-100 ${selected ? " border border-gray-400 bg-sky-600/10" : ""} `}>
    <button type="button" className="flex flex-row gap-x-4 items-center p-2 rounded-md hover:bg-gray-100 w-full">
      <UserAvatar user={user} size="sm" />

      <div className="flex flex-grow flex-col items-start">
        <span className="text-sm font-semibold">{user.name}</span>
        <span className="text-sm font-normal text-gray-500">{user.email}</span>
      </div>

      {selected && <LuCheck className="size-6 text-sky-600" />}
    </button>
  </li>
}

