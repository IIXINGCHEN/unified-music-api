// Minimal Node ambient declarations — this package intentionally does not
// depend on @types/node; only process.env is used (EXTERNAL_NCM_API_URL).
declare const process: {
	env: Record<string, string | undefined>;
};
