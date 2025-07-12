import { useState } from "react";
import { Button } from "../ui/button";
import { Mic } from "lucide-react";

export const Mainbar = ({ toggleMainPane }: { toggleMainPane: () => void }) => {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const handleMicClick = () => {
        toggleMainPane()
        if (isRecording) {
            setIsRecording(false)
            setRecordingTime(0)
        } else {
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