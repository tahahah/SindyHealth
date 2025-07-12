import React from "react";

export const TranscriptionPane = () => {
    const [transcriptLines, setTranscriptLines] = React.useState<string[]>([]);
    const transcriptEndRef = React.useRef<HTMLDivElement>(null);
    const transcriptLinesRef = React.useRef<string[]>(transcriptLines);
    const formattedTranscriptRef = React.useRef<string>('');

    React.useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptLines]);

    const onTranscript = (alternative: { transcript: string; words: { speaker: number; punctuated_word: string }[] }) => {
        console.warn('TranscriptPane: Received transcript object:', alternative);
        const plainTranscript = alternative.transcript;
        if (!plainTranscript) return;

        setTranscriptLines(prev => {
          const next = [...prev, plainTranscript];
          transcriptLinesRef.current = next;
          return next;
        });

        // Format the new transcript part with speaker info
        let newFormattedPart = '';
        if (alternative.words && alternative.words.length > 0) {
          let lastSpeaker = -1;
          for (const word of alternative.words) {
            if (word.speaker !== lastSpeaker) {
              lastSpeaker = word.speaker;
              if (newFormattedPart !== '') {
                newFormattedPart += '\n';
              }
              newFormattedPart += `Speaker ${word.speaker}: `;
            }
            newFormattedPart += word.punctuated_word + ' ';
          }
        } else {
          newFormattedPart = plainTranscript;
        }

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
        <div className="flex-1 glass rounded-2xl">
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