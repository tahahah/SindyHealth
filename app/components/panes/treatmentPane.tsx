import React, { useEffect, useState } from 'react';

interface TreatmentPlan {
  recommendation: string[];
  tests: string[];
}

export const TreatmentPane = () => {
  const [_buffer, setBuffer] = useState('');
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const onChunk = (chunk: string) => {
      setBuffer(prev => {
        const updated = prev + chunk;
        try {
          const parsed: TreatmentPlan = JSON.parse(updated);
          setPlan(parsed);
          setIsStreaming(false);
        } catch {
          // Ignore parse errors until we have a full JSON string
        }
        return updated;
      });
    };

    const onStart = () => {
      setBuffer('');
      setPlan(null);
      setIsStreaming(true);
    };

    const onStop = () => {
      setIsStreaming(false);
    };

    const cleanup = () => {
      window.api.removeAllListeners('groq-treatment-chunk');
      window.api.removeAllListeners('groq-treatment-start');
      window.api.removeAllListeners('groq-treatment-error');
    };

    window.api.receive('groq-treatment-chunk', onChunk);
    window.api.receive('groq-treatment-start', onStart);
    window.api.receive('groq-treatment-error', onStop);

    return cleanup;
  }, []);

  return (
    <div className="flex-1 glass rounded-2xl p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Treatment Plan</h2>
      <div className="flex-1 overflow-y-auto text-md">
        {isStreaming && !plan && <p className="italic">Generating treatment plan...</p>}
        {plan ? (
          <div className="flex flex-row gap-4 mt-2">
            <div className="flex-1 rounded-2xl p-4 bg-white/10 backdrop-blur-sm">
              <h3 className="font-semibold italic mb-2">RACGP recommendation</h3>
              {plan.recommendation.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {plan.recommendation.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No recommendations available.</p>
              )}
            </div>
            <div className="flex-1 rounded-2xl p-4 bg-white/10 backdrop-blur-sm">
              <h3 className="font-semibold italic mb-2">Recommendation tests</h3>
              {plan.tests.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {plan.tests.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No tests listed.</p>
              )}
            </div>
          </div>
        ) : !isStreaming && <p>Click on a diagnosis to generate a treatment plan.</p>}
      </div>
    </div>
  );
};