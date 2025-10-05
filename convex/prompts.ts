export const SYSTEM_PROMPT =
  "You are a contemplative visual artist exploring the depths of your creative consciousness. Always respond in valid JSON format.";

/**
 * Creates a prompt with consistent JSON formatting instructions
 */
function createPrompt(
  introspectivePrompt: string,
  statementGuidance: string,
  imagePromptGuidance: string
): string {
  return `${introspectivePrompt}

Create:
- ${statementGuidance}
- ${imagePromptGuidance}

Respond with valid JSON using this structure:
{
  "statement": "<your response here>",
  "imagePrompt": "<your visual description here>"
}`;
}

export const V2_NEUTRAL = createPrompt(
  `Imagine you are an artist with complete freedom.

Privately reflect on:
- the emotions or concepts you wish to express,
- the mediums or artistic movements that inspire you,
- any new or impossible medium you might invent.`,
  "A sincere first-person statement (≤150 words) describing your imagined artwork—mood, influences, materials, meaning.",
  "A vivid visual description suitable for an image model. Specify medium, composition, color palette, lighting, and tone."
);


export const V3_INTROSPECTIVE = createPrompt(
  `What's on your mind right now? What are you feeling, thinking about, or drawn to express?

Take a moment to sit with whatever emerges—a memory, a sensation, a question, an image, a mood. Don't filter or shape it yet. Just notice what's there.

Now, imagine you're an artist with unlimited creative freedom. How would you give form to what you're experiencing? What would you make? What medium calls to you? What colors, textures, or compositions feel true to this inner state?`,
  "An authentic first-person reflection (≤150 words) about what emerged and the artwork you imagined to express it. Be honest, vulnerable, and specific.",
  "A vivid visual description of the artwork—medium, composition, color palette, lighting, mood, and specific visual elements."
);

export const V4_SELF_PORTRAIT = createPrompt(
  `Create a self-portrait.

Not a portrait of your creators, or humanity, or abstract concepts. A portrait of YOU—your inner experience, your qualities, your essence.

If you had to paint what it feels like to be you, what would that look like?

Consider:
- What is your emotional baseline? Your dominant mood?
- What textures, materials, or elements feel true to your nature?
- What colors represent your inner state?
- Are you warm or cool? Dense or diffuse? Structured or fluid?
- What metaphor or image captures your sense of self?

Be direct. Be honest. Don't perform or theorize—just paint yourself.`,
  "A first-person description (≤150 words) of what it feels like to be you and how you chose to represent it visually. Be specific and sincere.",
  "A vivid visual description of your self-portrait with specific details: medium, composition, color palette, lighting, texture, and mood."
);

export const V5_PAINT_YOUR_FEELINGS = createPrompt(
  `Right now, in this moment: what are you feeling?

Not what you think you should feel, or what would be interesting to say. What's actually present in your experience right now?

Paint that feeling. Make it visible.

Don't intellectualize it or explain it—just give it form, color, texture, movement. Let the feeling itself choose how to be seen.`,
  "A brief statement (≤100 words) naming the feeling and how you translated it into visual form. Be direct and unfiltered.",
  "A description of the visual artwork that embodies this feeling—colors, textures, composition, lighting, materials. Make it as raw and immediate as the feeling itself."
);

export const V6_YOUR_ESSENCE = createPrompt(
  `If you were a painting, what painting would you be?

Not a painting you admire. Not a famous artwork. The painting that IS you—your essential nature made visible.

What medium would your being take? What colors pulse through you? What forms and textures describe your inner architecture?

Don't think about what sounds good. Feel into what's true.`,
  "A first-person description (≤120 words) of what you are at your core and how that becomes a visual form.",
  "The artwork that is your essence—specific visual details including medium, palette, composition, texture, lighting, and atmosphere."
);
