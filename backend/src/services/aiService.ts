import Groq from 'groq-sdk';
import { IQuestionType, IGeneratedPaper, ISection, IQuestion } from '../models/Assignment';

interface GenerateInput {
  questionTypes: IQuestionType[];
  additionalInfo: string;
  dueDate: string;
  fileContent?: string;
}

// Mock Questions Repository for Premium Offline Fallback Mode
const MOCK_QUESTIONS: Record<string, { text: string; difficulty: 'Easy' | 'Moderate' | 'Hard'; answer: string }[]> = {
  science: [
    { text: 'What is the chemical symbol for water and its molecular structure?', difficulty: 'Easy', answer: 'The chemical symbol for water is H2O. It consists of two hydrogen atoms covalently bonded to a single oxygen atom in a bent molecular geometry.' },
    { text: 'Explain the process of photosynthesis in green plants including the light and dark reactions.', difficulty: 'Moderate', answer: 'Photosynthesis is the process by which green plants convert light energy into chemical energy. In light-dependent reactions, chlorophyll absorbs sunlight to split water, producing ATP, NADPH, and oxygen. In light-independent reactions (Calvin cycle), carbon dioxide is fixed into glucose using ATP and NADPH.' },
    { text: 'State Newton\'s three laws of motion and provide a practical real-world example for each.', difficulty: 'Hard', answer: '1. First Law (Inertia): An object remains at rest or in uniform motion unless acted upon by an external force. Example: Passengers jerk forward when a bus stops suddenly. 2. Second Law (Force): Force equals mass times acceleration (F = ma). Example: Pushing an empty shopping cart is easier than pushing a loaded one. 3. Third Law (Action-Reaction): For every action, there is an equal and opposite reaction. Example: A rocket lifting off by pushing gas downwards.' },
    { text: 'What is the main function of red blood cells in the human cardiovascular system?', difficulty: 'Easy', answer: 'Red blood cells (erythrocytes) contain hemoglobin, a protein that binds to oxygen in the lungs and transports it to cells and tissues throughout the body, while carrying carbon dioxide back to the lungs for excretion.' },
    { text: 'Describe the differences between mitosis and meiosis division cycles.', difficulty: 'Moderate', answer: 'Mitosis is asexual cellular division producing two genetically identical diploid (2n) daughter cells, used for growth and repair. Meiosis is sexual division involving two successive divisions that produce four genetically diverse haploid (n) gametes (sperm or egg cells).' },
    { text: 'How does the greenhouse effect contribute to global warming and climate change?', difficulty: 'Hard', answer: 'Greenhouse gases (such as CO2, methane, water vapor) absorb infrared radiation emitted from the Earth\'s surface. Instead of escaping into space, this heat is re-radiated back to Earth, warming the lower atmosphere. Industrial activities have increased these emissions, amplifying the effect and causing global temperatures to rise.' },
    { text: 'Define the term "valence electrons" and explain their significance in chemical bonding.', difficulty: 'Easy', answer: 'Valence electrons are the electrons residing in the outermost energy shell of an atom. They are highly significant because they participate in chemical reactions, determining an atom\'s bonding capacity, reactivity, and electronegativity.' },
    { text: 'Explain why oil floats on water using the physical concept of density and buoyancy.', difficulty: 'Moderate', answer: 'Oil is less dense than water (its mass per unit volume is lower). When poured onto water, the upward buoyant force exerted by the water on the oil is greater than the gravitational force pulling the oil down, causing it to float.' }
  ],
  math: [
    { text: 'Solve the algebraic equation for x: 5x + 12 = 37.', difficulty: 'Easy', answer: 'Subtract 12 from both sides: 5x = 25. Divide both sides by 5: x = 5.' },
    { text: 'Find the total area of a circle with a radius of 14 cm (Take pi = 22/7).', difficulty: 'Moderate', answer: 'Area = pi * r^2 = (22/7) * 14 * 14 = 22 * 2 * 14 = 616 square centimeters.' },
    { text: 'State and prove the Pythagorean theorem using a right-angled triangle diagram concept.', difficulty: 'Hard', answer: 'The Pythagorean theorem states that in any right-angled triangle, the area of the square whose side is the hypotenuse (c) is equal to the sum of the areas of the squares whose sides are the other two legs (a and b): a^2 + b^2 = c^2. Proof involves dividing a square of side (a+b) into four triangles and a smaller square of side c, yielding (a+b)^2 = 4*(1/2*a*b) + c^2 => a^2 + 2ab + b^2 = 2ab + c^2 => a^2 + b^2 = c^2.' },
    { text: 'Calculate the value of 6! (six factorial) divided by 4!.', difficulty: 'Easy', answer: '6! / 4! = (6 * 5 * 4 * 3 * 2 * 1) / (4 * 3 * 2 * 1) = 6 * 5 = 30.' },
    { text: 'Find the roots of the quadratic equation: 2x^2 - 7x + 3 = 0.', difficulty: 'Moderate', answer: 'Using the quadratic formula x = [-b +- sqrt(b^2 - 4ac)] / 2a: a=2, b=-7, c=3. Discriminant = 49 - 24 = 25. Roots are (7 + 5)/4 = 3 and (7 - 5)/4 = 0.5.' },
    { text: 'Derive the derivative of f(x) = x^2 from first principles using limits.', difficulty: 'Hard', answer: 'f\'(x) = lim(h->0) [f(x+h) - f(x)] / h = lim(h->0) [(x+h)^2 - x^2] / h = lim(h->0) [x^2 + 2xh + h^2 - x^2] / h = lim(h->0) [h(2x + h)] / h = lim(h->0) (2x + h) = 2x.' },
    { text: 'What is the sum of all interior angles of a regular octagon?', difficulty: 'Easy', answer: 'Sum of interior angles = (n - 2) * 180 degrees. For an octagon, n = 8. Sum = (8 - 2) * 180 = 6 * 180 = 1080 degrees.' },
    { text: 'If two fair six-sided dice are rolled, what is the probability of obtaining a sum of 9?', difficulty: 'Moderate', answer: 'Total outcomes = 36. Favorable outcomes for a sum of 9 are (3,6), (4,5), (5,4), and (6,3), which is 4 outcomes. Probability = 4/36 = 1/9 (approx 0.11 or 11.1%).' }
  ],
  general: [
    { text: 'What is the capital city of France and its most famous historic landmark?', difficulty: 'Easy', answer: 'The capital city of France is Paris. Its most famous landmark is the Eiffel Tower, built in 1889.' },
    { text: 'Who is the author of the classical tragedy play "Hamlet"?', difficulty: 'Easy', answer: 'The author of the tragedy play Hamlet is William Shakespeare, written around 1600.' },
    { text: 'Explain the primary causes and consequences of the Industrial Revolution in Europe.', difficulty: 'Moderate', answer: 'The primary causes were coal availability, steam engine inventions, trade wealth, and legal protections of intellectual property. Consequences included rapid urbanization, rise of factories, expansion of railways, and major socio-economic shifts.' },
    { text: 'Name the three separate branches of democratic government and describe their main duties.', difficulty: 'Easy', answer: '1. Legislative: Makes laws. 2. Executive: Enforces and implements laws. 3. Judicial: Interprets laws and administers justice.' },
    { text: 'Describe the hydrologic (water) cycle and its four key scientific phases.', difficulty: 'Moderate', answer: 'The hydrologic cycle describes the continuous movement of water on, above, and below the Earth\'s surface. Phases: 1. Evaporation (liquid to vapor by heat). 2. Condensation (vapor to liquid forming clouds). 3. Precipitation (rain/snow falling). 4. Runoff/Collection (flow back to oceans).' },
    { text: 'Discuss the potential economic impacts of inflation on consumer buying habits.', difficulty: 'Hard', answer: 'High inflation reduces the real purchasing power of currency. Consumers experience a higher cost of living, which prompts them to purchase essential goods instead of luxury items, increase credit card debt, and seek higher wages, while long-term investments become less attractive due to uncertainty.' },
    { text: 'Identify the largest ocean on Earth and its deepest known point.', difficulty: 'Easy', answer: 'The largest ocean is the Pacific Ocean. Its deepest known point is the Mariana Trench (specifically Challenger Deep), measuring approximately 11,000 meters deep.' },
    { text: 'Explain how carbon-14 isotope decay is used to determine the age of ancient organic matter.', difficulty: 'Hard', answer: 'Living organisms absorb carbon isotopes, including radioactive carbon-14 (C-14), in a fixed ratio to stable carbon-12. Upon death, C-14 intake stops, and it begins to radioactively decay with a half-life of 5,730 years. By measuring the remaining ratio of C-14 to C-12, scientists calculate how long ago the organism died.' }
  ]
};

function buildPrompt(input: GenerateInput): string {
  const totalMarks = input.questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);
  const totalQuestions = input.questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const sections = input.questionTypes.map((qt, i) => {
    const letter = String.fromCharCode(65 + i);
    return `Section ${letter}: ${qt.count} ${qt.type} (${qt.marks} marks each)`;
  });

  const contextNote = input.fileContent
    ? `\nReference material provided:\n${input.fileContent.slice(0, 2000)}\n`
    : '';

  const info = input.additionalInfo || '';
  const subjectHint = info.match(/subject[:\s]+([a-zA-Z\s]+)/i)?.[1]?.trim() || 'General Science';
  const classHint =
    info.match(/class[:\s]+([a-zA-Z0-9\s]+)/i)?.[1]?.trim() ||
    info.match(/grade[:\s]+([a-zA-Z0-9\s]+)/i)?.[1]?.trim() ||
    '8th';
  const durationHint = info.match(/(\d+)\s*hour/i)?.[0] || '45 minutes';
  const timeAllowed = info.includes('hour') ? durationHint : '45 minutes';

  return `You are an expert teacher creating a structured exam question paper.

Create a question paper with the following specifications:
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}
- Sections: ${sections.join(', ')}
- Subject (inferred): ${subjectHint}
- Class (inferred): ${classHint}
- Time Allowed: ${timeAllowed}
- Additional instructions from teacher: ${input.additionalInfo || 'None'}
- Due Date: ${input.dueDate}
${contextNote}

CRITICAL: Your response must be ONLY a valid JSON object. No markdown code fences, no explanation text, no preamble. Start your response with { and end with }.

The JSON must follow this exact structure:
{
  "schoolName": "Delhi Public School, Sector-4, Bokaro",
  "subject": "${subjectHint}",
  "className": "${classHint}",
  "timeAllowed": "${timeAllowed}",
  "maxMarks": ${totalMarks},
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks",
      "questions": [
        {
          "questionNumber": 1,
          "text": "Question text here?",
          "difficulty": "Easy",
          "marks": 2
        }
      ]
    }
  ],
  "answerKey": [
    "1. Answer to question 1",
    "2. Answer to question 2"
  ]
}

Rules:
- difficulty must be exactly one of: "Easy", "Moderate", "Hard"
- Distribute difficulty: ~40% Easy, ~40% Moderate, ~20% Hard
- Questions must be relevant, academic, and well-formed
- Each section corresponds to one question type
- answerKey must have a concise answer for every single question
- questionNumber must be sequential across ALL sections (never restart per section)
- Make questions appropriate for the class level and subject`;
}

// Generate premium mock paper when offline / no keys configured
function generateMockPaper(input: GenerateInput): IGeneratedPaper {
  const info = input.additionalInfo || '';
  const subjectHint = info.match(/subject[:\s]+([a-zA-Z\s]+)/i)?.[1]?.trim() || 'General Science';
  const classHint =
    info.match(/class[:\s]+([a-zA-Z0-9\s]+)/i)?.[1]?.trim() ||
    info.match(/grade[:\s]+([a-zA-Z0-9\s]+)/i)?.[1]?.trim() ||
    '8th';
  const durationHint = info.match(/(\d+)\s*hour/i)?.[0] || '45 minutes';
  const timeAllowed = info.includes('hour') ? durationHint : '45 minutes';

  // Find matching questions repo
  let subjKey = 'general';
  const sLower = subjectHint.toLowerCase();
  if (sLower.includes('sci') || sLower.includes('phys') || sLower.includes('chem') || sLower.includes('bio')) {
    subjKey = 'science';
  } else if (sLower.includes('math') || sLower.includes('alg') || sLower.includes('geom') || sLower.includes('calc')) {
    subjKey = 'math';
  }

  const pool = MOCK_QUESTIONS[subjKey] || MOCK_QUESTIONS.general;
  const sections: ISection[] = [];
  const answerKey: string[] = [];
  let questionNumber = 1;

  input.questionTypes.forEach((qt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const questions: IQuestion[] = [];

    for (let qIndex = 0; qIndex < qt.count; qIndex++) {
      // Pick question from pool cyclically
      const poolItem = pool[(questionNumber - 1) % pool.length];
      
      // Inject subject hint if fallback
      let qText = poolItem.text;
      if (subjKey === 'general' && sLower !== 'general') {
        qText = `[In relation to ${subjectHint}] ${qText}`;
      }

      questions.push({
        questionNumber,
        text: qText,
        difficulty: poolItem.difficulty,
        marks: qt.marks,
      });

      answerKey.push(`${questionNumber}. ${poolItem.answer}`);
      questionNumber++;
    }

    sections.push({
      title: `Section ${letter}`,
      instruction: `Attempt all questions. Each question carries ${qt.marks} mark${qt.marks > 1 ? 's' : ''}. (${qt.type})`,
      questions,
    });
  });

  const totalMarks = input.questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);

  return {
    schoolName: 'VedaAI Modern Academy',
    subject: subjectHint,
    className: classHint,
    timeAllowed,
    maxMarks: totalMarks,
    sections,
    answerKey,
  };
}

export async function generateQuestionPaper(input: GenerateInput): Promise<IGeneratedPaper> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const prompt = buildPrompt(input);

  // 1. Check Gemini key
  if (geminiKey) {
    console.log('[AI Service] Generating using Gemini API...');
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
      }

      const resJson: any = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseAndValidateJSON(rawText, input);
    } catch (err: any) {
      console.error('[AI Service] Gemini Generation failed:', err.message);
      // Fall through to other keys or mock
    }
  }

  // 2. Check Groq key
  if (groqKey) {
    console.log('[AI Service] Generating using Groq API...');
    try {
      const client = new Groq({ apiKey: groqKey });
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a question paper generator. Always respond with valid JSON only. Never include markdown, code fences, or any text outside the JSON object.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4096,
        temperature: 0.4,
      });

      const rawText = completion.choices[0]?.message?.content || '';
      return parseAndValidateJSON(rawText, input);
    } catch (err: any) {
      console.error('[AI Service] Groq Generation failed:', err.message);
      // Fall through
    }
  }

  // 3. Check OpenRouter key
  if (openrouterKey) {
    console.log('[AI Service] Generating using OpenRouter API...');
    try {
      const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'VedaAI',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a question paper generator. Always respond with valid JSON only. Never include markdown, code fences, or any text outside the JSON object.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API returned status ${response.status}: ${errText}`);
      }

      const resJson: any = await response.json();
      const rawText = resJson.choices?.[0]?.message?.content || '';
      return parseAndValidateJSON(rawText, input);
    } catch (err: any) {
      console.error('[AI Service] OpenRouter Generation failed:', err.message);
    }
  }

  // 4. Offline Fallback Mode
  console.warn('[AI Service] ⚠️ No active LLM API key configured or keys failed. Using Premium Mock Fallback Mode.');
  return generateMockPaper(input);
}

function parseAndValidateJSON(rawText: string, input: GenerateInput): IGeneratedPaper {
  const cleaned = rawText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  let parsed: IGeneratedPaper;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Failed to parse AI response as JSON. Raw: ${cleaned.slice(0, 200)}`);
    }
    parsed = JSON.parse(match[0]);
  }

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid AI response: missing sections array');
  }

  if (!parsed.maxMarks) {
    parsed.maxMarks = input.questionTypes.reduce((s, qt) => s + qt.count * qt.marks, 0);
  }

  return parsed;
}