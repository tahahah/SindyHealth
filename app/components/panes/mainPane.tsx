import { TranscriptionPane } from "./transcriptionPane";
import { PatientPane } from "./patientPane";
import { TreatmentPane } from "./treatmentPane";

export const MainPane = () => {
    return (
        <div className="flex max-h-full w-full p-2 bg-transparent gap-2 items-start justify-center overflow-y-hidden">
            <div className="flex w-full max-h-full gap-2">
                <div className="w-1/2">
                    <div className="bg-transparent h-1/2"></div>
                    <TranscriptionPane />
                </div>
                <div className="w-1/2 flex flex-col gap-2">
                    <PatientPane />
                    <TreatmentPane />
                </div>
            </div>
        </div>
    )
}