import type { ObjectsData, TypeFamilyKey } from "../types";

export interface TypeObjects {
  primaryObject: string;
  primaryReason?: string;
}

function toModuloIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

function getFamilyKey(typeCode: string): TypeFamilyKey {
  const familyKey = typeCode.slice(0, 2);
  if (familyKey === "VH" || familyKey === "WH" || familyKey === "VG" || familyKey === "WG") {
    return familyKey;
  }

  throw new Error(`Unsupported family key '${familyKey}'.`);
}

export function getObjectsForType(
  typeCode: string,
  titleIndex: number,
  objectsData: ObjectsData
): TypeObjects {
  if (typeCode.length < 6) {
    throw new Error("Type code must contain 6 letters.");
  }

  const directPair = objectsData.objectsByTypeCode?.[typeCode];
  if (directPair) {
    return {
      primaryObject: directPair.primary,
      primaryReason: directPair.primaryReason
    };
  }

  const familyKey = getFamilyKey(typeCode);
  const primaryPool = objectsData.primaryObjectPools?.[familyKey];

  if (!primaryPool || primaryPool.length === 0) {
    throw new Error(`Primary object pool for '${familyKey}' is empty.`);
  }

  const primaryIndex = toModuloIndex(titleIndex, primaryPool.length);
  const primaryObject = primaryPool[primaryIndex];

  return {
    primaryObject
  };
}
