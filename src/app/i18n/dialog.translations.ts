import { LanguageCode } from './language.model';

export interface DialogCopy {
  confirm: string;
  cancel: string;
}

export const DIALOG_COPY: Record<LanguageCode, DialogCopy> = {
  en: { confirm: 'OK', cancel: 'Cancel' },
  ar: { confirm: 'موافق', cancel: 'إلغاء' },
  fr: { confirm: 'OK', cancel: 'Annuler' },
};
