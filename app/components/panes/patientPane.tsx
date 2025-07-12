import React, { useState, useEffect } from 'react';
import { z } from 'zod';

const DiagnosesSchema = z.object({
  likely_diagnoses: z.array(
    z.object({
      name: z.string(),
      symptoms: z.array(z.string())
    })
  ).default([])
});



export const PatientPane = () => {
  const [diagnoses, setDiagnoses] = useState<z.infer<typeof DiagnosesSchema>['likely_diagnoses']>([]);
  const [streamedDiagnoses, setStreamedDiagnoses] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState('');

  useEffect(() => {
    const onDiagnosesChunk = (chunk: string) => {
      setStreamedDiagnoses(prev => prev + chunk);
    };

    const onQuestionsChunk = (chunk: { text: string }) => {
      setSuggestedQuestions(prev => prev + chunk.text);
    };

    const cleanup = () => {
      window.api.removeAllListeners('groq-diagnoses-chunk');
      window.api.removeAllListeners('live-audio-stop');
      window.api.removeAllListeners('groq-diagnoses-start');
      window.api.removeAllListeners('gemini-transcript');
    };

    window.api.receive('groq-diagnoses-chunk', onDiagnosesChunk);
    window.api.receive('gemini-transcript', onQuestionsChunk);

    window.api.receive('live-audio-stop', () => {
      setDiagnoses([]);
      setStreamedDiagnoses('');
      setSuggestedQuestions('');
    });

    window.api.receive('groq-diagnoses-start', () => {
      setStreamedDiagnoses('');
    });

    return cleanup;
  }, []);

  useEffect(() => {
    if (streamedDiagnoses) {
      try {
        const parsed = DiagnosesSchema.parse(JSON.parse(streamedDiagnoses));
        setDiagnoses(parsed.likely_diagnoses);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // JSON is not yet complete, do nothing
      }
    }
  }, [streamedDiagnoses]);
  return (
    <div className="flex-1 glass rounded-2xl flex flex-row h-full">
      {/* Left Column - Suggested Questions & Likely Diagnoses */}
      <div className="flex flex-col w-2/3 p-4">
        {/* Suggested Questions Section */}
        <div className="flex-1 flex flex-col min-h-0 pb-4">
          <h2 className="text-xl font-semibold mb-2 shrink-0">Suggested Questions</h2>
          <div className="flex-1 overflow-y-auto space-y-2 text-md">
            {suggestedQuestions ? (
              <p className="whitespace-pre-wrap">{suggestedQuestions}</p>
            ) : (
              <p>Suggested questions will appear here...</p>
            )}
          </div>
        </div>

        {/* Likely Diagnoses Section */}
        <div className="flex-1 flex flex-col min-h-0 pt-4 border-t">
          <h2 className="text-xl font-semibold mb-2 shrink-0">Likely Diagnoses</h2>
          <div className="flex-1 overflow-y-auto space-y-1 text-md">
            {diagnoses.length > 0 ? (
              diagnoses.map((diag, index) => (
                <div key={index} className="p-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20" onClick={() => window.api.send('groq-get-treatment', diag.name)}>
                  <h3 className="font-bold text-lg">{diag.name}</h3>
                  <ul className="list-disc list-inside pl-2">
                    {diag.symptoms.map((symptom, sIndex) => (
                      <li key={sIndex}>{symptom}</li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p>Likely diagnoses will appear here...</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Patient Information */}
      <div className="flex-1 flex flex-col w-1/3 p-4 border-l ">
        <h2 className="text-xl font-semibold mb-2 shrink-0">Patient Information</h2>
        <div className="flex-1 overflow-y-auto space-y-1 text-md">
          <p>Patient information will appear here...</p>
        </div>
      </div>
    </div>
  );
}
