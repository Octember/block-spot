import { extendRecurringReservations } from '../operations/recurring-reservations-index';
import { PrismaClient } from '@prisma/client';

/**
 * Job to extend recurring reservations
 * This job is scheduled to run daily to ensure that recurring reservations
 * always have occurrences generated for the next few weeks
 */
export const extendRecurringReservationsJob = async () => {
  console.log('Starting job: extendRecurringReservationsJob');
  
  const prisma = new PrismaClient();
  
  try {
    // Create a context object with the Prisma client
    const context = {
      entities: prisma
    };
    
    // Call the extendRecurringReservations function
    const result = await extendRecurringReservations(context);
    
    console.log(`Job completed: extendRecurringReservationsJob - Processed ${result.processedCount} recurring reservations`);
    
    return result;
  } catch (error) {
    console.error('Error in extendRecurringReservationsJob:', error);
    throw error;
  } finally {
    // Disconnect the Prisma client
    await prisma.$disconnect();
  }
}; 