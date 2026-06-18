import { LanguageCode } from './language.model';

export interface ResetCopy {
  verifying: string;
  linkInvalidTitle: string;
  backToLogin: string;
  title: string;
  subtitle: string;
  newPasswordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  updating: string;
  changePassword: string;
  invalidLink: string;
  invalidLinkType: string;
  validateError: string;
  passwordTooShort: string;
  passwordsDontMatch: string;
  updateError: string;
  updateSuccess: string;
}

export const RESET_COPY: Record<LanguageCode, ResetCopy> = {
  en: {
    verifying: 'Verifying reset link…',
    linkInvalidTitle: 'Link invalid',
    backToLogin: 'Back to login',
    title: 'Set a new password',
    subtitle: 'Enter and confirm your new password below.',
    newPasswordPlaceholder: 'New password',
    confirmPasswordPlaceholder: 'Confirm new password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    updating: 'Updating…',
    changePassword: 'Change password',
    invalidLink: 'Invalid or expired reset link. Please request a new one.',
    invalidLinkType: 'Invalid reset link.',
    validateError: 'Could not validate reset link.',
    passwordTooShort: 'Password must be at least 6 characters.',
    passwordsDontMatch: 'Passwords do not match.',
    updateError: 'Could not update password.',
    updateSuccess: 'Password updated successfully. Redirecting to login…',
  },
  ar: {
    verifying: 'جارٍ التحقق من رابط إعادة التعيين…',
    linkInvalidTitle: 'الرابط غير صالح',
    backToLogin: 'العودة لتسجيل الدخول',
    title: 'تعيين كلمة مرور جديدة',
    subtitle: 'أدخِل كلمة المرور الجديدة وأكّدها أدناه.',
    newPasswordPlaceholder: 'كلمة المرور الجديدة',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور الجديدة',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    updating: 'جارٍ التحديث…',
    changePassword: 'تغيير كلمة المرور',
    invalidLink: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.',
    invalidLinkType: 'رابط إعادة تعيين غير صالح.',
    validateError: 'تعذّر التحقق من رابط إعادة التعيين.',
    passwordTooShort: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    passwordsDontMatch: 'كلمتا المرور غير متطابقتين.',
    updateError: 'تعذّر تحديث كلمة المرور.',
    updateSuccess: 'تم تحديث كلمة المرور بنجاح. جارٍ التوجيه لتسجيل الدخول…',
  },
  fr: {
    verifying: 'Vérification du lien de réinitialisation…',
    linkInvalidTitle: 'Lien invalide',
    backToLogin: 'Retour à la connexion',
    title: 'Définir un nouveau mot de passe',
    subtitle: 'Saisissez et confirmez votre nouveau mot de passe ci-dessous.',
    newPasswordPlaceholder: 'Nouveau mot de passe',
    confirmPasswordPlaceholder: 'Confirmer le nouveau mot de passe',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    updating: 'Mise à jour…',
    changePassword: 'Changer le mot de passe',
    invalidLink: 'Lien de réinitialisation invalide ou expiré. Veuillez en demander un nouveau.',
    invalidLinkType: 'Lien de réinitialisation invalide.',
    validateError: 'Impossible de valider le lien de réinitialisation.',
    passwordTooShort: 'Le mot de passe doit comporter au moins 6 caractères.',
    passwordsDontMatch: 'Les mots de passe ne correspondent pas.',
    updateError: 'Impossible de mettre à jour le mot de passe.',
    updateSuccess: 'Mot de passe mis à jour. Redirection vers la connexion…',
  },
};
