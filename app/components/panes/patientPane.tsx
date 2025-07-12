export const PatientPane = () => {
  return (
    <div className="flex-1 glass rounded-2xl">
      <div className="flex flex-col h-full p-4">
        {/* Top Row - Identified Patient Symptoms */}
        <div className="flex-1 flex flex-col mb-4 min-h-0">
          <h2 className="text-xl font-semibold mb-2 shrink-0">Identified Patient Symptoms</h2>
          <div className="flex-1 overflow-y-auto space-y-1 text-md">
            <p>Identified symptoms will appear here...</p>
          </div>
        </div>

        {/* Bottom Row - Patient Information */}
        <div className="flex-1 flex flex-col min-h-0 border-t pt-4">
          <h2 className="text-xl font-semibold mb-2 shrink-0">Patient Information</h2>
          <div className="flex-1 overflow-y-auto space-y-1 text-md">
            <p>Patient information will appear here...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
