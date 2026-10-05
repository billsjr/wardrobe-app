// Tags a clothing photo with Claude vision. Called from the app with { image: <base64 JPEG> }.
// Supabase verifies the caller's sign-in token before this runs (verify_jwt is on by default).
import Anthropic from 'npm:@anthropic-ai/sdk';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk/helpers/zod';
import { z } from 'npm:zod';

const ItemTags = z.object({
  category: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory']),
  subcategory: z.string().describe('Short plain name, e.g. "t-shirt", "jeans", "trainers"'),
  colors: z
    .array(
      z.enum([
        'black', 'white', 'grey', 'beige', 'brown', 'navy', 'denim', 'blue', 'green',
        'olive', 'red', 'pink', 'purple', 'yellow', 'orange', 'multi',
      ]),
    )
    .describe('Main colors, most prominent first, at most 3'),
  pattern: z.enum(['solid', 'striped', 'checked', 'floral', 'graphic', 'other']),
  seasons: z
    .array(z.enum(['spring', 'summer', 'autumn', 'winter']))
    .describe('Seasons it suits; empty if it works all year'),
  formality: z.enum(['casual', 'smart', 'formal', 'sport']),
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the function's secrets

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let image: string | undefined;
  try {
    ({ image } = await req.json());
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (typeof image !== 'string' || image.length === 0) return json({ error: 'Missing image' }, 400);
  if (image.length * 0.75 > MAX_IMAGE_BYTES) return json({ error: 'Image too large' }, 413);

  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 1024,
      output_config: { effort: 'low', format: zodOutputFormat(ItemTags) },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            {
              type: 'text',
              text:
                'This photo shows one piece of clothing someone is adding to their digital wardrobe. ' +
                'Tag it so an app can combine it into outfits. If several items are visible, tag the most prominent one.',
            },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return json({ error: 'Could not tag this photo' }, 422);
    }
    return json({ tags: response.parsed_output });
  } catch (error) {
    console.error('tag-item failed', error);
    return json({ error: 'Tagging failed' }, 502);
  }
});
