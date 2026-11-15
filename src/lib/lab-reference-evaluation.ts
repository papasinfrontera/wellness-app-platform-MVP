/**
 * Reference-interval comparison only, not diagnosis or "optimal" classification.
 * Requires an independently verified interval matching the specimen and unit.
 * No default thresholds, conversions or inferred ranges.
 */
export type LabMeasurement={value:number;unit:string;specimen?:string;method?:string};
export type VerifiedLabInterval={low:number;high:number;unit:string;verified:boolean;specimen?:string;method?:string};
export type LabReferenceState="within_reference"|"outside_reference"|"not_evaluated";
export function evaluateLabReference(measurement:LabMeasurement,interval:VerifiedLabInterval|null):LabReferenceState{
 if(!interval||!interval.verified)return "not_evaluated";
 if(!Number.isFinite(measurement.value)||!Number.isFinite(interval.low)||!Number.isFinite(interval.high)||interval.low>interval.high)return "not_evaluated";
 if(!measurement.unit||!interval.unit||measurement.unit.trim()!==interval.unit.trim())return "not_evaluated";
 if(interval.specimen && (!measurement.specimen||interval.specimen!==measurement.specimen))return "not_evaluated";
 if(interval.method && (!measurement.method||interval.method!==measurement.method))return "not_evaluated";
 return measurement.value>=interval.low&&measurement.value<=interval.high?"within_reference":"outside_reference";
}
