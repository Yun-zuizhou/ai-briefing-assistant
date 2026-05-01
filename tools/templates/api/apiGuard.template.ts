import type { __Feature__PageData } from '../../types/page-data';
import { isRecord, isString } from '../apiValidation';

export function is__Feature__PageData(value: unknown): value is __Feature__PageData {
  if (!isRecord(value)) return false;
  return isString(value.title)
    && isString(value.summary);
}
