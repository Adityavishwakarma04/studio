'use server';

/**
 * @fileOverview Provides plant care tips for a given plant species using AI.
 *
 * - suggestPlantCareTips - A function that suggests plant care tips.
 * - SuggestPlantCareTipsInput - The input type for the suggestPlantCareTips function.
 * - SuggestPlantCareTipsOutput - The return type for the suggestPlantCareTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPlantCareTipsInputSchema = z.object({
  plantName: z.string().describe('The common name of the plant.'),
});
export type SuggestPlantCareTipsInput = z.infer<typeof SuggestPlantCareTipsInputSchema>;

const SuggestPlantCareTipsOutputSchema = z.object({
  careTips: z.string().describe('A list of care tips for the plant.'),
});
export type SuggestPlantCareTipsOutput = z.infer<typeof SuggestPlantCareTipsOutputSchema>;

export async function suggestPlantCareTips(input: SuggestPlantCareTipsInput): Promise<SuggestPlantCareTipsOutput> {
  return suggestPlantCareTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPlantCareTipsPrompt',
  input: {schema: SuggestPlantCareTipsInputSchema},
  output: {schema: SuggestPlantCareTipsOutputSchema},
  prompt: `Suggest basic care tips for the following plant species: {{{plantName}}}.\n\nCare Tips: `,
});

const suggestPlantCareTipsFlow = ai.defineFlow(
  {
    name: 'suggestPlantCareTipsFlow',
    inputSchema: SuggestPlantCareTipsInputSchema,
    outputSchema: SuggestPlantCareTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
