import React, { useEffect, useState } from 'react';

export const TreatmentPane = () => {
  const [streamedPlan, setStreamedPlan] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const onChunk = (chunk: string) => {
      setStreamedPlan(prev => prev + chunk);
    };

    const onStart = () => {
      setStreamedPlan('');
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
      <h2 className="text-xl font-semibold mb-4">Treatment Plan</h2>
      <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-md">
        {isStreaming && !streamedPlan && <p className="italic">Generating treatment plan...</p>}
        {streamedPlan ? <p>{streamedPlan}</p> : !isStreaming && <p>Click on a diagnosis to generate a treatment plan.</p>}
      </div>
    </div>
  );
};