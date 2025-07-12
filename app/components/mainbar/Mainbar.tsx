import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Mic } from "lucide-react";
import { AudioStreamHandle, startAudioStreaming } from "@/app/lib/liveAudioStream";
import { FrameStreamHandle, startFrameStreaming } from "@/app/lib/liveFrameStream";

export const Mainbar = ({ toggleMainPane }: { toggleMainPane: () => void }) => {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)

    
    // Live audio streaming refs
    const audioHandleRef = useRef<AudioStreamHandle | null>(null);
    const frameHandleRef = useRef<FrameStreamHandle | null>(null);

    const handleMicClick = async () => {
        toggleMainPane()
        if (isRecording) {
            setIsRecording(false)
            setRecordingTime(0)
            // ======== Send stop signal ========
            window.api.send('live-audio-stop');
        } else {
            try {
                // ======== Send start signal ========
                window.api.send('live-audio-start');

                // ======== Start Recording (optimised) ========
                const { handle: audioHandle, streams } = await startAudioStreaming((chunk) => {
                  window.api.send('live-audio-chunk', chunk);
                });
                audioHandleRef.current = audioHandle;
        
                // ---- JPEG frame streaming ----
                // if (streams.systemStream) {
                //     const frameHandle = startFrameStreaming(
                //       streams.systemStream,
                //       (jpeg) => {
                //         window.api.send('live-image-chunk', jpeg);
                //       },
                //       { width: 1280, height: 720, intervalMs: 1000, quality: 1}
                //     );
                //     frameHandleRef.current = frameHandle;
                //     console.log('Frame streaming started');
                // } else {
                //     console.warn('System stream not available, skipping frame streaming.');
                // }
            } catch (err) {
                console.error('Failed to start recording:', err);
            }
            setIsRecording(true)
            setRecordingTime(0)
        }
    }
    
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = time % 60
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    return(
        <div className="pl-5 pr-5 glass rounded-full font-sans flex-none w-[10vw] h-[5.5vh] max-w-[33.333vw] max-h-[5.5vh]">
            <div className="flex items-center justify-center w-full h-full">
                <div className="flex items-center gap-2">
                    <Button variant={isRecording ? 'destructive' : 'ghost'} size="lg" className="w-full" onClick={handleMicClick}>
                        <span>{formatTime(recordingTime)}</span>
                        <Mic className={isRecording ? 'animate-pulse text-red-500' : ''} />
                    </Button>
                </div>
            </div>
        </div>
    )
}