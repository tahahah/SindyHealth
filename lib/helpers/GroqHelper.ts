import { Groq } from "groq-sdk";

// Debounce utility function for async functions
function debounce<T extends (...args: any[]) => Promise<any>>(func: T, delay: number): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestPromiseResolve: ((value: Awaited<ReturnType<T>> | PromiseLike<Awaited<ReturnType<T>>>) => void) | null = null;
  let latestPromiseReject: ((reason?: any) => void) | null = null;

  return function(this: any, ...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    return new Promise((resolve, reject) => {
      latestPromiseResolve = resolve;
      latestPromiseReject = reject;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const currentResolve = latestPromiseResolve;
        const currentReject = latestPromiseReject;

        Promise.resolve(func.apply(this, args))
          .then(currentResolve!)
          .catch(currentReject!);

        latestPromiseResolve = null;
        latestPromiseReject = null;
      }, delay);
    });
  };
}
import { z } from "zod";
import { GROQ_DIAGNOSES_SYSTEM_PROMPT, GROQ_TREATMENT_SYSTEM_PROMPT } from "./systemPrompt";

const GROQ_API_KEY =
  (import.meta as any).env?.VITE_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error(
    'GROQ_API_KEY is not set. Ensure it exists in .env or as a system env variable, or that it is defined in Vite env files.'
  );
}

const groq = new Groq({ apiKey: GROQ_API_KEY });
// Define a schema with Zod for the expected JSON response
const DiagnosesSchema = z.object({
  likely_diagnoses: z.array(
    z.object({
      name: z.string(),
      symptoms: z.array(z.string())
    })
  ).default([])
});

export class GroqHelper {
  private readonly modelName: string;
  public debouncedStreamDiagnoses: (
    prevDiagnoses: z.infer<typeof DiagnosesSchema>['likely_diagnoses'],
    currentTranscript: string,
    onChunk: (chunk: string) => void,
    onStreamStart: () => void
  ) => Promise<z.infer<typeof DiagnosesSchema>>;

  public async streamTreatmentPlan(
    diagnosis: string,
    currentTranscript: string,
    onChunk: (chunk: string) => void,
    onStreamStart: () => void
  ): Promise<string> {
    const systemContent = GROQ_TREATMENT_SYSTEM_PROMPT;
    const userContent = `Diagnosis: ${diagnosis}\n\nTranscript:\n${currentTranscript}`;
    onStreamStart();

    let fullResponse = "";
    const stream = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent }
      ],
      model: this.modelName,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      onChunk(content);
    }
    return fullResponse.trim();
  }

  constructor(modelName: string = "qwen/qwen3-32b") {
    this.modelName = modelName;
    this.debouncedStreamDiagnoses = debounce(
      this._streamDiagnoses.bind(this), // Bind 'this' to the private method
      2000 // 2-second debounce delay
    );
  }

  private async _streamDiagnoses(
    prevDiagnoses: z.infer<typeof DiagnosesSchema>['likely_diagnoses'],
    currentTranscript: string,
    onChunk: (chunk: string) => void,
    onStreamStart: () => void
  ): Promise<z.infer<typeof DiagnosesSchema>> {
    // console.warn('GroqHelper: streamQuestions called with:', { prevQuestions, currentTranscript });
    const systemContent = JSON.stringify({
      role: "system",
      content: GROQ_DIAGNOSES_SYSTEM_PROMPT,
    }); // System message for Groq

    const userContent = `Here are the previous diagnoses you suggested:\n<prev_diagnoses>\n${JSON.stringify(prevDiagnoses, null, 2)}\n</prev_diagnoses>\n\nAnalyze the updated call transcript and provide a list of likely diagnoses with their corresponding symptoms:\n<current_transcript>\n${currentTranscript}\n</current_transcript>`; // User message with previous diagnoses and current transcript

    onStreamStart(); // Signal that the stream is starting

    let fullResponseContent = ""; // Accumulator for the full streamed response
    console.warn('GroqHelper: Initializing Groq client and streaming...');

    const stream = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemContent }, // System message for the assistant's behavior
        { role: "user", content: userContent }, // User message with context for analysis
      ],
      model: this.modelName, // Model to use for generating completions
      response_format: { type: "json_object" }, // Ensure the response is a JSON object
      stream: true, // Enable streaming for partial message deltas
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''; // Extract content from each chunk
      fullResponseContent += content; // Accumulate content
      onChunk(content); // Call the callback with each chunk
    }

    // Parse and validate JSON after the stream is complete
    try {
      const jsonData = JSON.parse(fullResponseContent);
      const validated = DiagnosesSchema.parse(jsonData);
      return validated; // Return validated data
    } catch (error) {
      console.error("Error parsing or validating Groq response:", error);
      throw error; // Re-throw the error for upstream handling
    }
  }

  // Public method that calls the debounced version
  public async streamDiagnoses(
    prevDiagnoses: z.infer<typeof DiagnosesSchema>['likely_diagnoses'],
    currentTranscript: string,
    onChunk: (chunk: string) => void,
    onStreamStart: () => void
  ): Promise<z.infer<typeof DiagnosesSchema>> {
    return this.debouncedStreamDiagnoses(prevDiagnoses, currentTranscript, onChunk, onStreamStart);
  }
}
