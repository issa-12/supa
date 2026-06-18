import { LanguageCode } from './language.model';

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDoc {
  backLink: string;
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const PRIVACY_COPY: Record<LanguageCode, LegalDoc> = {
  en: {
    backLink: 'Back to ReadTrack',
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: May 2026',
    sections: [
      { heading: '1. Information We Collect', body: 'We collect information you provide when creating an account (name, email address), content you post (book reviews, community posts), and usage data to improve the platform.' },
      { heading: '2. How We Use Your Information', body: 'We use your information to operate ReadTrack, personalise your reading recommendations, and send you notifications about activity on your account.' },
      { heading: '3. Data Storage', body: 'Your data is stored securely on Supabase infrastructure. Profile pictures are stored in Supabase Storage. We do not sell your personal information to third parties.' },
      { heading: '4. Cookies', body: 'We use session cookies to keep you logged in. No third-party advertising cookies are used.' },
      { heading: '5. Your Rights', body: 'You may request deletion of your account and associated data at any time by contacting us. You can update your profile information from your profile settings page.' },
      { heading: '6. Contact', body: 'For privacy-related questions, contact us at privacy@readtrack.app.' },
    ],
  },
  ar: {
    backLink: 'العودة إلى ReadTrack',
    title: 'سياسة الخصوصية',
    lastUpdated: 'آخر تحديث: مايو 2026',
    sections: [
      { heading: '1. المعلومات التي نجمعها', body: 'نجمع المعلومات التي تقدمها عند إنشاء حساب (الاسم والبريد الإلكتروني)، والمحتوى الذي تنشره (مراجعات الكتب ومنشورات المجتمع)، وبيانات الاستخدام لتحسين المنصة.' },
      { heading: '2. كيف نستخدم معلوماتك', body: 'نستخدم معلوماتك لتشغيل ReadTrack، وتخصيص توصيات القراءة لك، وإرسال إشعارات حول النشاط على حسابك.' },
      { heading: '3. تخزين البيانات', body: 'تُخزَّن بياناتك بأمان على بنية Supabase التحتية. تُخزَّن صور الملف الشخصي في Supabase Storage. نحن لا نبيع معلوماتك الشخصية لأطراف ثالثة.' },
      { heading: '4. ملفات تعريف الارتباط', body: 'نستخدم ملفات تعريف ارتباط الجلسة لإبقائك مسجّل الدخول. لا تُستخدم أي ملفات تعريف ارتباط إعلانية لأطراف ثالثة.' },
      { heading: '5. حقوقك', body: 'يمكنك طلب حذف حسابك والبيانات المرتبطة به في أي وقت عن طريق التواصل معنا. يمكنك تحديث معلومات ملفك الشخصي من صفحة إعدادات الملف الشخصي.' },
      { heading: '6. التواصل', body: 'للأسئلة المتعلقة بالخصوصية، تواصل معنا على privacy@readtrack.app.' },
    ],
  },
  fr: {
    backLink: 'Retour à ReadTrack',
    title: 'Politique de confidentialité',
    lastUpdated: 'Dernière mise à jour : mai 2026',
    sections: [
      { heading: '1. Informations que nous collectons', body: 'Nous collectons les informations que vous fournissez à la création d\'un compte (nom, adresse e-mail), le contenu que vous publiez (avis de livres, messages communautaires) et les données d\'utilisation pour améliorer la plateforme.' },
      { heading: '2. Comment nous utilisons vos informations', body: 'Nous utilisons vos informations pour faire fonctionner ReadTrack, personnaliser vos recommandations de lecture et vous envoyer des notifications sur l\'activité de votre compte.' },
      { heading: '3. Stockage des données', body: 'Vos données sont stockées en toute sécurité sur l\'infrastructure Supabase. Les photos de profil sont stockées dans Supabase Storage. Nous ne vendons pas vos informations personnelles à des tiers.' },
      { heading: '4. Cookies', body: 'Nous utilisons des cookies de session pour vous garder connecté. Aucun cookie publicitaire tiers n\'est utilisé.' },
      { heading: '5. Vos droits', body: 'Vous pouvez demander la suppression de votre compte et des données associées à tout moment en nous contactant. Vous pouvez mettre à jour les informations de votre profil depuis la page des paramètres.' },
      { heading: '6. Contact', body: 'Pour toute question relative à la confidentialité, contactez-nous à privacy@readtrack.app.' },
    ],
  },
};

export const TERMS_COPY: Record<LanguageCode, LegalDoc> = {
  en: {
    backLink: 'Back to ReadTrack',
    title: 'Terms of Service',
    lastUpdated: 'Last updated: May 2026',
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By creating a ReadTrack account you agree to these Terms of Service. If you do not agree, do not use the platform.' },
      { heading: '2. User Conduct', body: 'You agree not to post content that is hateful, abusive, or violates the rights of others. Community posts are subject to AI moderation. Repeated violations may result in account suspension.' },
      { heading: '3. Content Ownership', body: 'You retain ownership of content you post. By posting, you grant ReadTrack a non-exclusive licence to display that content on the platform.' },
      { heading: '4. Book Data', body: 'Book metadata (titles, authors, descriptions, covers) is sourced from the Google Books API and is subject to Google\'s terms. ReadTrack does not claim ownership of this data.' },
      { heading: '5. Account Termination', body: 'We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from your profile settings.' },
      { heading: '6. Disclaimer', body: 'ReadTrack is provided "as is" without warranty. We are not liable for any damages arising from use of the platform.' },
      { heading: '7. Contact', body: 'For terms-related questions, contact us at legal@readtrack.app.' },
    ],
  },
  ar: {
    backLink: 'العودة إلى ReadTrack',
    title: 'شروط الخدمة',
    lastUpdated: 'آخر تحديث: مايو 2026',
    sections: [
      { heading: '1. قبول الشروط', body: 'بإنشائك حساباً على ReadTrack فإنك توافق على شروط الخدمة هذه. إذا كنت لا توافق، فلا تستخدم المنصة.' },
      { heading: '2. سلوك المستخدم', body: 'توافق على عدم نشر محتوى يحض على الكراهية أو مسيء أو ينتهك حقوق الآخرين. تخضع منشورات المجتمع لإشراف الذكاء الاصطناعي. قد تؤدي المخالفات المتكررة إلى تعليق الحساب.' },
      { heading: '3. ملكية المحتوى', body: 'تحتفظ بملكية المحتوى الذي تنشره. بنشرك للمحتوى، تمنح ReadTrack ترخيصاً غير حصري لعرض ذلك المحتوى على المنصة.' },
      { heading: '4. بيانات الكتب', body: 'تُستمَد بيانات الكتب (العناوين والمؤلفون والأوصاف والأغلفة) من واجهة Google Books API وتخضع لشروط Google. لا تدّعي ReadTrack ملكية هذه البيانات.' },
      { heading: '5. إنهاء الحساب', body: 'نحتفظ بالحق في تعليق أو إنهاء الحسابات التي تخالف هذه الشروط. يمكنك حذف حسابك في أي وقت من إعدادات ملفك الشخصي.' },
      { heading: '6. إخلاء المسؤولية', body: 'يُقدَّم ReadTrack "كما هو" دون أي ضمان. لسنا مسؤولين عن أي أضرار تنشأ عن استخدام المنصة.' },
      { heading: '7. التواصل', body: 'للأسئلة المتعلقة بالشروط، تواصل معنا على legal@readtrack.app.' },
    ],
  },
  fr: {
    backLink: 'Retour à ReadTrack',
    title: 'Conditions d\'utilisation',
    lastUpdated: 'Dernière mise à jour : mai 2026',
    sections: [
      { heading: '1. Acceptation des conditions', body: 'En créant un compte ReadTrack, vous acceptez ces conditions d\'utilisation. Si vous n\'êtes pas d\'accord, n\'utilisez pas la plateforme.' },
      { heading: '2. Conduite de l\'utilisateur', body: 'Vous acceptez de ne pas publier de contenu haineux, abusif ou portant atteinte aux droits d\'autrui. Les messages communautaires sont soumis à une modération par IA. Des violations répétées peuvent entraîner la suspension du compte.' },
      { heading: '3. Propriété du contenu', body: 'Vous conservez la propriété du contenu que vous publiez. En publiant, vous accordez à ReadTrack une licence non exclusive pour afficher ce contenu sur la plateforme.' },
      { heading: '4. Données des livres', body: 'Les métadonnées des livres (titres, auteurs, descriptions, couvertures) proviennent de l\'API Google Books et sont soumises aux conditions de Google. ReadTrack ne revendique aucune propriété sur ces données.' },
      { heading: '5. Résiliation du compte', body: 'Nous nous réservons le droit de suspendre ou de résilier les comptes qui enfreignent ces conditions. Vous pouvez supprimer votre compte à tout moment depuis vos paramètres de profil.' },
      { heading: '6. Avertissement', body: 'ReadTrack est fourni « tel quel », sans garantie. Nous ne sommes pas responsables des dommages résultant de l\'utilisation de la plateforme.' },
      { heading: '7. Contact', body: 'Pour toute question relative aux conditions, contactez-nous à legal@readtrack.app.' },
    ],
  },
};
