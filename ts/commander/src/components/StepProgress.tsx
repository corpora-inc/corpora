interface StepProgressProps {
    currentIndex: number; // zero-based
    total: number;
}

export function StepProgress({ currentIndex, total }: StepProgressProps) {
    const percent = Math.round(((currentIndex + 1) / total) * 100);
    return (
        <div className="mb-6">
            <div className="flex justify-between text-sm text-neutral-600 mb-1">
                <span>Step {currentIndex + 1} of {total}</span>
                <span>{percent}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                    className="h-2 bg-neutral-900 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
