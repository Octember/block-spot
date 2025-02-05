
import { defineUserSignupFields } from 'wasp/server/auth';

export const userSignupFields = defineUserSignupFields({
  name: async (data) => {
    const name = data.name

    if (typeof name !== 'string') {
      throw new Error('Name is required')
    }
    
    return name;
  },
})

