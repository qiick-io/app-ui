import { SegmentedBar } from '@/components/charts/segmented-bar';
import { OUTCOME_SEGMENTS, SEVERITY_SEGMENTS } from '../screens/excubia-data';

/** Compositions with the fixed semantic palette: severity, then check outcomes. */
export default function SegmentedBarDemo() {
    return (
        <div className="flex flex-col gap-6">
            <SegmentedBar
                title="Open findings by severity"
                segments={SEVERITY_SEGMENTS}
            />
            <SegmentedBar title="Check outcomes" segments={OUTCOME_SEGMENTS} />
        </div>
    );
}
