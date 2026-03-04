import type { ObjectAxisPoolKey, ObjectsData, TypeFamilyKey } from "../types";

export interface TypeObjects {
  primaryObject: string;
  backupObject: string;
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

function poolKeyFromLetter(position: 3 | 4 | 5 | 6, letter: string): ObjectAxisPoolKey {
  switch (position) {
    case 3:
      if (letter === "K") {
        return "KP";
      }
      if (letter === "P") {
        return "PJ";
      }
      break;
    case 4:
      if (letter === "R") {
        return "RJ";
      }
      if (letter === "J") {
        return "JJ";
      }
      break;
    case 5:
      if (letter === "S") {
        return "SC";
      }
      if (letter === "C") {
        return "CC";
      }
      break;
    case 6:
      if (letter === "M") {
        return "MA";
      }
      if (letter === "A") {
        return "AA";
      }
      break;
    default:
      break;
  }

  throw new Error(`Invalid type code letter '${letter}' at position ${position}.`);
}

export function getObjectsForType(
  typeCode: string,
  titleIndex: number,
  objectsData: ObjectsData
): TypeObjects {
  if (typeCode.length < 6) {
    throw new Error("Type code must contain 6 letters.");
  }

  const familyKey = getFamilyKey(typeCode);
  const primaryPool = objectsData.primaryObjectPools[familyKey];

  if (!primaryPool || primaryPool.length === 0) {
    throw new Error(`Primary object pool for '${familyKey}' is empty.`);
  }

  const primaryIndex = toModuloIndex(titleIndex, primaryPool.length);
  const primaryObject = primaryPool[primaryIndex];

  const axisPoolKeys: ObjectAxisPoolKey[] = [
    poolKeyFromLetter(3, typeCode[2]),
    poolKeyFromLetter(4, typeCode[3]),
    poolKeyFromLetter(5, typeCode[4]),
    poolKeyFromLetter(6, typeCode[5])
  ];

  const combinedBackupPool = axisPoolKeys.flatMap((poolKey) => objectsData.axisObjectPools[poolKey] ?? []);

  if (combinedBackupPool.length === 0) {
    throw new Error("Combined backup object pool is empty.");
  }

  const backupIndex = toModuloIndex(titleIndex, combinedBackupPool.length);
  let backupObject = combinedBackupPool[backupIndex];

  if (backupObject === primaryObject && combinedBackupPool.length > 1) {
    backupObject = combinedBackupPool[(backupIndex + 1) % combinedBackupPool.length];
  }

  return {
    primaryObject,
    backupObject
  };
}
