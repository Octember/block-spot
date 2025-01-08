import { type Task } from 'wasp/entities';

import {
  generateGptResponse,
  deleteTask,
  updateTask,
  createTask,
  useQuery,
  getAllTasksByUser,
  getVenueInfo
} from 'wasp/client/operations';

import { useState, useMemo } from 'react';
import { CgSpinner } from 'react-icons/cg';
import { TiDelete } from 'react-icons/ti';
import type { GeneratedSchedule, MainTask, SubTask } from '../demo-ai-app/schedule';
import { cn } from '../client/cn';
import { VenueList } from './venues';

export default function DemoAppPage() {
  return (
    <div className='py-10 lg:mt-10'>
      <div className='mx-auto max-w-full px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl text-center'>
          <h2 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white'>
            <span className='text-yellow-600'>AI</span>  Scheduler
          </h2>
        </div>
        {/* <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-white'>
          This example app uses OpenAI's chat completions with function calling to return a structured JSON object. Try
          it out, enter your day's tasks, and let AI do the rest!
        </p> */}
        <div className='my-8 border rounded-3xl border-gray-900/10 dark:border-gray-100/10'>
          <div className='sm:w-[90%] md:w-[70%] lg:w-[50%] py-10 px-6 mx-auto my-8 space-y-10'>
            <NewTaskForm handleCreateTask={createTask} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NewTaskForm({ handleCreateTask }: { handleCreateTask: typeof createTask }) {

  const { data: venues, isLoading: isVenueLoading } = useQuery(getVenueInfo);
  console.log(venues);



  return (
    <div className='flex flex-col justify-center gap-10'>
      <VenueList venues={venues || []} />
    </div>
  );
}


