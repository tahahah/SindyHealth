import { TranscriptionPane } from "./transcriptionPane";
import { PatientPane } from "./patientPane";
import { TreatmentPane } from "./treatmentPane";

export const MainPane = () => {
    return (
        <div className="flex max-h-full w-full p-2 bg-transparent gap-2 items-start justify-center">
            <div className="flex w-3/5 max-h-3/5 gap-2">
                <div className="w-3/5">
                    <TranscriptionPane />
                </div>
                <div className="w-2/5 flex flex-col gap-2">
                    <PatientPane />
                    <TreatmentPane />
                </div>
            </div>
        </div>
    )
}