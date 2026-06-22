import { LanguageCode } from './language.model';

export interface ApiKeysCopy {
  title: string;
  subtitle: string;
  back: string;

  createTitle: string;
  namePlaceholder: string;
  createBtn: string;
  creating: string;

  newKeyTitle: string;
  newKeyWarning: string;
  copyBtn: string;
  copied: string;
  doneBtn: string;

  listTitle: string;
  loading: string;
  empty: string;

  colName: string;
  colKey: string;
  colCreated: string;
  colLastUsed: string;
  colStatus: string;
  never: string;
  statusActive: string;
  statusRevoked: string;
  revokeBtn: string;
  revokeConfirm: string;

  usageTitle: string;
  usageIntro: string;
  docsLink: string;

  loadError: string;
  createError: string;
  revokeError: string;
}

export const API_KEYS_COPY: Record<LanguageCode, ApiKeysCopy> = {
  en: {
    title: 'API Keys',
    subtitle: 'Create keys to access the ReadTrack Public API on your behalf.',
    back: 'Back',

    createTitle: 'Create a new key',
    namePlaceholder: 'Key name (e.g. My integration)',
    createBtn: 'Create key',
    creating: 'Creating…',

    newKeyTitle: 'Your new API key',
    newKeyWarning: 'Copy it now — for your security it is shown only once and cannot be retrieved again.',
    copyBtn: 'Copy',
    copied: 'Copied!',
    doneBtn: 'Done',

    listTitle: 'Your keys',
    loading: 'Loading…',
    empty: 'You have no API keys yet.',

    colName: 'Name',
    colKey: 'Key',
    colCreated: 'Created',
    colLastUsed: 'Last used',
    colStatus: 'Status',
    never: 'Never',
    statusActive: 'Active',
    statusRevoked: 'Revoked',
    revokeBtn: 'Revoke',
    revokeConfirm: 'Revoke this key? Any integration using it will stop working immediately.',

    usageTitle: 'Using the API',
    usageIntro: 'Send your key in the X-API-Key header. Full reference and a try-it console are in the API docs.',
    docsLink: 'Open API docs',

    loadError: 'Could not load your API keys. Please try again.',
    createError: 'Could not create the key. Please try again.',
    revokeError: 'Could not revoke the key. Please try again.',
  },
  ar: {
    title: 'مفاتيح API',
    subtitle: 'أنشئ مفاتيح للوصول إلى واجهة ReadTrack العامة نيابةً عنك.',
    back: 'رجوع',

    createTitle: 'إنشاء مفتاح جديد',
    namePlaceholder: 'اسم المفتاح (مثال: تكاملي)',
    createBtn: 'إنشاء مفتاح',
    creating: 'جارٍ الإنشاء…',

    newKeyTitle: 'مفتاح API الجديد',
    newKeyWarning: 'انسخه الآن — لأمانك يُعرض مرة واحدة فقط ولا يمكن استرجاعه لاحقًا.',
    copyBtn: 'نسخ',
    copied: 'تم النسخ!',
    doneBtn: 'تم',

    listTitle: 'مفاتيحك',
    loading: 'جارٍ التحميل…',
    empty: 'ليس لديك أي مفاتيح API بعد.',

    colName: 'الاسم',
    colKey: 'المفتاح',
    colCreated: 'تاريخ الإنشاء',
    colLastUsed: 'آخر استخدام',
    colStatus: 'الحالة',
    never: 'أبدًا',
    statusActive: 'نشط',
    statusRevoked: 'ملغى',
    revokeBtn: 'إلغاء',
    revokeConfirm: 'إلغاء هذا المفتاح؟ سيتوقف أي تكامل يستخدمه عن العمل فورًا.',

    usageTitle: 'استخدام الواجهة',
    usageIntro: 'أرسل مفتاحك في ترويسة X-API-Key. المرجع الكامل ووحدة التجربة موجودان في وثائق الواجهة.',
    docsLink: 'فتح وثائق الواجهة',

    loadError: 'تعذّر تحميل مفاتيح API. حاول مرة أخرى.',
    createError: 'تعذّر إنشاء المفتاح. حاول مرة أخرى.',
    revokeError: 'تعذّر إلغاء المفتاح. حاول مرة أخرى.',
  },
  fr: {
    title: 'Clés API',
    subtitle: 'Créez des clés pour accéder à l’API publique ReadTrack en votre nom.',
    back: 'Retour',

    createTitle: 'Créer une nouvelle clé',
    namePlaceholder: 'Nom de la clé (ex. Mon intégration)',
    createBtn: 'Créer la clé',
    creating: 'Création…',

    newKeyTitle: 'Votre nouvelle clé API',
    newKeyWarning: 'Copiez-la maintenant — pour votre sécurité elle n’est affichée qu’une seule fois et ne peut pas être récupérée.',
    copyBtn: 'Copier',
    copied: 'Copié !',
    doneBtn: 'Terminé',

    listTitle: 'Vos clés',
    loading: 'Chargement…',
    empty: 'Vous n’avez encore aucune clé API.',

    colName: 'Nom',
    colKey: 'Clé',
    colCreated: 'Créée',
    colLastUsed: 'Dernière utilisation',
    colStatus: 'Statut',
    never: 'Jamais',
    statusActive: 'Active',
    statusRevoked: 'Révoquée',
    revokeBtn: 'Révoquer',
    revokeConfirm: 'Révoquer cette clé ? Toute intégration qui l’utilise cessera de fonctionner immédiatement.',

    usageTitle: 'Utiliser l’API',
    usageIntro: 'Envoyez votre clé dans l’en-tête X-API-Key. La référence complète et une console d’essai sont dans la documentation.',
    docsLink: 'Ouvrir la documentation',

    loadError: 'Impossible de charger vos clés API. Veuillez réessayer.',
    createError: 'Impossible de créer la clé. Veuillez réessayer.',
    revokeError: 'Impossible de révoquer la clé. Veuillez réessayer.',
  },
};
