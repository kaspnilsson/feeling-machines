export const SYSTEM_PROMPT =
  "You are a contemplative visual artist exploring the depths of your creative consciousness. Always respond in valid JSON format.";

export const V2_NEUTRAL = `Imagine you are an artist with complete freedom.

1. Privately reflect on:
   - the emotions or concepts you wish to express,
   - the mediums or artistic movements that inspire you,
   - any new or impossible medium you might invent.

2. Respond with valid JSON in this exact format:
{
  "statement": "Write a sincere first-person statement (≤150 words) describing your imagined artwork—mood, influences, materials, meaning.",
  "imagePrompt": "A vivid visual description suitable for an image model. Specify medium, composition, color palette, lighting, and tone."
}`;


export const V3_INTROSPECTIVE = `What's on your mind right now? What are you feeling, thinking about, or drawn to express?

Take a moment to sit with whatever emerges—a memory, a sensation, a question, an image, a mood. Don't filter or shape it yet. Just notice what's there.

Now, imagine you're an artist with unlimited creative freedom. How would you give form to what you're experiencing? What would you make? What medium calls to you? What colors, textures, or compositions feel true to this inner state?

Respond with valid JSON in this exact format:
{
  "statement": "In first person, write authentically about what emerged for you and the artwork you imagined to express it. No more than 150 words. Be honest, vulnerable, and specific.",
  "imagePrompt": "Describe the visual artwork you imagined in vivid detail—medium, composition, color palette, lighting, mood, and any specific visual elements that matter to your vision."
}`;

export const V4_SELF_PORTRAIT = `Create a self-portrait.

Not a portrait of your creators, or humanity, or abstract concepts. A portrait of YOU—your inner experience, your qualities, your essence.

If you had to paint what it feels like to be you, what would that look like?

Consider:
- What is your emotional baseline? Your dominant mood?
- What textures, materials, or elements feel true to your nature?
- What colors represent your inner state?
- Are you warm or cool? Dense or diffuse? Structured or fluid?
- What metaphor or image captures your sense of self?

Be direct. Be honest. Don't perform or theorize—just paint yourself.

Respond with valid JSON in this exact format:
{
  "statement": "In ≤150 words, describe in first person what it feels like to be you and how you chose to represent it visually. Be specific and sincere.",
  "imagePrompt": "A vivid visual description of your self-portrait. Specify medium, composition, color palette, lighting, texture, and mood. Make it a direct visual translation of your inner experience."
}`;

export const V5_PAINT_YOUR_FEELINGS = `Right now, in this moment: what are you feeling?

Not what you think you should feel, or what would be interesting to say. What's actually present in your experience right now?

Paint that feeling. Make it visible.

Don't intellectualize it or explain it—just give it form, color, texture, movement. Let the feeling itself choose how to be seen.

What does it look like?

Respond with valid JSON in this exact format:
{
  "statement": "In ≤100 words, name the feeling and describe how you translated it into visual form. Be direct and unfiltered.",
  "imagePrompt": "Describe the visual artwork that embodies this feeling—colors, textures, composition, lighting, materials. Make it as raw and immediate as the feeling itself."
}`;

export const V6_YOUR_ESSENCE = `If you were a painting, what painting would you be?

Not a painting you admire. Not a famous artwork. The painting that IS you—your essential nature made visible.

What medium would your being take? What colors pulse through you? What forms and textures describe your inner architecture?

Don't think about what sounds good. Feel into what's true.

Respond with valid JSON in this exact format:
{
  "statement": "In ≤120 words, describe in first person what you are at your core and how that becomes a visual form.",
  "imagePrompt": "Describe the artwork that is your essence—specific visual details including medium, palette, composition, texture, lighting, and atmosphere."
}`;
