import { createCreem } from 'creem_io';

export const creem = createCreem({
  apiKey: process.env.CREEM_API_KEY!,
  testMode: true, // Set to false for production
});
