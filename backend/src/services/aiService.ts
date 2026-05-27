import Groq from 'groq-sdk';
import { IQuestionType, IGeneratedPaper } from '../models/Assignment';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Best Groq model for structured JSON output
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface GenerateInput {
  questionTypes: IQuestionType[];
  additionalInfo: string;
  dueDate: string;
  fileContent?: string;
}

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

  // Extract subject/class/duration from additionalInfo
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

export async function generateQuestionPaper(input: GenerateInput): Promise<IGeneratedPaper> {
  const prompt = buildPrompt(input);

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a question paper generator. Always respond with valid JSON only. Never include markdown, code fences, or any text outside the JSON object.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 4096,
    temperature: 0.4, // Lower temp = more consistent JSON structure
  });

  const rawText = completion.choices[0]?.message?.content || '';

  // Strip any accidental markdown fences
  const cleaned = rawText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  let parsed: IGeneratedPaper;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try extracting JSON from within the response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Failed to parse Groq response as JSON. Raw: ${cleaned.slice(0, 200)}`);
    }
    parsed = JSON.parse(match[0]);
  }

  // Validate required fields
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid AI response: missing sections array');
  }
  if (!parsed.maxMarks) {
    parsed.maxMarks = input.questionTypes.reduce((s, qt) => s + qt.count * qt.marks, 0);
  }

  return parsed;
}