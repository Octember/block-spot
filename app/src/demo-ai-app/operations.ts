import {Task, GptResponse, Venue} from 'wasp/entities';
import type {
  GenerateGptResponse,
  CreateTask,
  DeleteTask,
  UpdateTask,
  GetGptResponses,
  GetAllTasksByUser,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { GeneratedSchedule } from './schedule';
import OpenAI from 'openai';

const openai = setupOpenAI();
function setupOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    return new HttpError(500, 'OpenAI API key is not set');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

//#region Actions
type GptPayload = {
  message: string;
};

async function extractDate(message: string) {
  try {
    if (openai instanceof Error) {
      throw openai;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",  // You can choose any available model
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts the time from the user's message.
                    They will ask if something is available, you need to extract the START and END time of the reservation.
                    Also parse the description of the reservation from the user's message, and return it as a string.
          
                    Use today's date, ${new Date().toISOString()} to determine the date of the reservation.
                    ALWAYS return the time in the format '{"start": "YYYY-MM-DD HH:MM", "end": "YYYY-MM-DD HH:MM", "description": "<description>"}'`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 50
    });
    console.log("Result:", response.choices);
    
    return response.choices[0].message.content?.trim();
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

export const generateGptResponse: GenerateGptResponse<GptPayload, string> = async ({ message }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  try {
    // check if openai is initialized correctly with the API key
    if (openai instanceof Error) {
      throw openai;
    }

    const hasCredits = context.user.credits > 0;
    const hasValidSubscription =
      !!context.user.subscriptionStatus &&
      context.user.subscriptionStatus !== 'deleted' &&
      context.user.subscriptionStatus !== 'past_due';

    const date = await extractDate(message);
      // const canUserContinue = hasCredits || hasValidSubscription;


    return date ? date : "No date found";

    

    // return JSON.parse(gptArgs);
  } catch (error: any) {
    if (!context.user.subscriptionStatus && error?.statusCode != 402) {
      await context.entities.User.update({
        where: { id: context.user.id },
        data: {
          credits: {
            increment: 1,
          },
        },
      });
    }
    console.error(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || 'Internal server error';
    throw new HttpError(statusCode, errorMessage);
  }
};

export const createTask: CreateTask<Pick<Task, 'description'>, Task> = async ({ description }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await context.entities.Task.create({
    data: {
      description,
      user: { connect: { id: context.user.id } },
    },
  });

  return task;
};

export const updateTask: UpdateTask<Partial<Task>, Task> = async ({ id, isDone, time }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await context.entities.Task.update({
    where: {
      id,
    },
    data: {
      isDone,
      time,
    },
  });

  return task;
};

export const deleteTask: DeleteTask<Pick<Task, 'id'>, Task> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await context.entities.Task.delete({
    where: {
      id,
    },
  });

  return task;
};
//#endregion

//#region Queries
export const getGptResponses: GetGptResponses<void, GptResponse[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.GptResponse.findMany({
    where: {
      user: {
        id: context.user.id,
      },
    },
  });
};

export const getAllTasksByUser: GetAllTasksByUser<void, Task[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Task.findMany({
    where: {
      user: {
        id: context.user.id,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};
//#endregion
