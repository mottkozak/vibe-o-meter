const OBJECT_IMAGE_OVERRIDES: Record<string, string> = {
  "5 gallon bucket": "5_gallon_bucket",
  "bottle cap": "bottlecap",
  "light switch": "lightswitch",
  "measuring tape": "tape_measure",
  "rubber band": "rubberband",
  "soap bar": "soap",
  tongs: "salad_tongs",
  windchime: "windchimes",
  "yo yo": "yo-yo",
  "yo-yo": "yo-yo"
};

function normalizeObjectStem(objectName: string): string {
  const normalized = objectName.trim().toLowerCase();
  return (
    OBJECT_IMAGE_OVERRIDES[normalized] ??
    normalized
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  );
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }
  return output;
}

function withPathVariants(path: string): string[] {
  const trimmed = path.replace(/^\/+/, "");
  return dedupe([path, `/${trimmed}`, trimmed, `./${trimmed}`]);
}

export function getObjectImageCandidates(objectName: string): string[] {
  const stem = normalizeObjectStem(objectName);
  const base = import.meta.env.BASE_URL;
  const basePaths = [
    `${base}images/${stem}.png`,
    `${base}images/${stem.replace(/_/g, "")}.png`,
    `${base}images/${stem.replace(/_/g, "-")}.png`
  ];

  const raw = basePaths.flatMap((path) => withPathVariants(path));
  return dedupe(raw);
}

export function getCroppedObjectImageCandidates(objectName: string): string[] {
  const stem = normalizeObjectStem(objectName);
  const base = import.meta.env.BASE_URL;

  const basePaths = [
    `${base}images/cropped_mascots/${stem}_cropped_processed_by_imagy.png`,
    `${base}images/cropped_images/${stem}_cropped_processed_by_imagy.png`,
    `${base}images/cropped_images/${stem}.png`,
    `${base}images/cropped_images/${stem}_cropped.png`,
    `${base}images/cropped_images/${stem.replace(/_/g, "-")}.png`,
    `${base}images/cropped_images/${stem.replace(/_/g, "")}.png`
  ];

  const raw = basePaths.flatMap((path) => withPathVariants(path));
  return dedupe(raw);
}
