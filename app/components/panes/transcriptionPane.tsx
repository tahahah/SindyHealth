import React from "react";

export const TranscriptionPane = () => {
    const [transcriptLines, setTranscriptLines] = React.useState<string[]>([]);
    const transcriptEndRef = React.useRef<HTMLDivElement>(null);
    const transcriptLinesRef = React.useRef<string[]>(transcriptLines);
    const formattedTranscriptRef = React.useRef<string>('');

    React.useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptLines]);

    const onTranscript = (alternative: { transcript: string; words: { speaker: number; punctuated_word: string }[], channel: number }) => {
        console.warn('TranscriptPane: Received transcript object:', alternative);
        const plainTranscript = alternative.transcript;
        if (!plainTranscript) return;

        const speakerLabel = alternative.channel === 0 ? 'Clinician' : 'Patient';
        const newFormattedPart = `${speakerLabel}: ${plainTranscript}`;

        setTranscriptLines(prev => {
          const next = [...prev, newFormattedPart.trim()];
          transcriptLinesRef.current = next;
          return next;
        });



        // Append to the full formatted transcript history
        formattedTranscriptRef.current += newFormattedPart.trim() + '\n';

        // Send the full transcript to the main process for diagnosis
        window.api.send('groq-get-diagnoses', formattedTranscriptRef.current);
      };

    React.useEffect(() => {
        window.api.receive('live-transcript', onTranscript);

        return () => {
            window.api.removeAllListeners('live-transcript');
        };
    }, []);

    return (
        <div className="flex-1 glass rounded-2xl max-h-1/2">
            <div className="flex items-center justify-center h-full">
            <div className="flex-1 flex flex-col p-4 pb-2 min-h-0">
        <h2 className="text-xl font-semibold mb-2 shrink-0">Live Transcription</h2>
        <div className="flex-1 flex flex-col justify-end overflow-y-auto space-y-1 text-md content-end">
          {transcriptLines.map((line, index) => (
            <p key={index} className="break-words">{line}</p>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>
            </div>
        </div>
    )
}