import { LanguageCode } from './language.model';

export interface ProfileCopy {
  ownTitle: string;
  myProfileTitle: string;
  otherTitle: string;
  profileTitle: string;
  goHome: string;
  goHomeBtn: string;
  joinedSince: string;
  readingSincePrefix: string;
  editProfile: string;
  editProfileBtn: string;
  addFriend: string;
  addFriendBtn: string;
  cancelRequest: string;
  cancelRequestBtn: string;
  accept: string;
  acceptBtn: string;
  decline: string;
  declineBtn: string;
  friends: string;
  friendsBtn: string;
  friendsTitle: string;
  report: string;
  reportBtn: string;
  booksReadThisYear: string;
  booksReadThisYearLabel: string;
  goalPercent: string;
  editGoal: string;
  editGoalBtn: string;
  saveGoal: string;
  saveBtn: string;
  cancelGoal: string;
  cancelBtn: string;
  totalRated: string;
  totalRatedLabel: string;
  booksWithRatings: string;
  booksWithRatingsDesc: string;
  currentlyReading: string;
  currentlyReadingTitle: string;
  currentlyReadingDesc: string;
  readingBadge: string;
  recentPosts: string;
  recentPostsTitle: string;
  findFriends: string;
  findFriendsTitle: string;
  findFriendsSearchPlaceholder: string;
  searchPlaceholder: string;
  searchingState: string;
  searchingMsg: string;
  searchNoResults: string;
  viewButton: string;
  viewBtn: string;
  sentLabel: string;
  addFriendSearch: string;
  friendRequests: string;
  friendRequestsTitle: string;
  friendsList: string;
  emptyFriends: string;
  noFriendsYetMsg: string;
  discoverBooks: string;
  discoverBooksBtn: string;
  mostLiked: string;
  mostLikedDesc: string;
  inBetween: string;
  inBetweenDesc: string;
  leastLiked: string;
  leastLikedDesc: string;
  noRatedBooks: string;
  findBooks: string;
  editPanelTitle: string;
  displayName: string;
  namePlaceholder: string;
  username: string;
  usernamePlaceholder: string;
  bio: string;
  bioPlaceholder: string;
  cancelEdit: string;
  saveChanges: string;
  saving: string;
  savingMsg: string;
  privacyPolicy: string;
  termsOfService: string;
  copyright: string;
  avatarAlt: string;
  errorImageFile: string;
  errorImageSize: string;
  errorUpload: string;
  errorFriendSend: string;
  errorFriendCancel: string;
  errorFriendAccept: string;
  errorFriendDecline: string;
  errorUnfriend: string;
  noUsersFoundMsg: string;
  profileNotFoundMsg: string;
  friendCountDesc: string;
}

export const PROFILE_COPY: Record<LanguageCode, ProfileCopy> = {
  en: {
    ownTitle: 'My Profile',
    myProfileTitle: 'My Profile',
    otherTitle: 'Profile',
    profileTitle: 'Profile',
    goHome: 'Go home',
    goHomeBtn: 'Go home',
    joinedSince: 'Reading since {{ date }}',
    readingSincePrefix: 'Reading since ',
    editProfile: 'Edit Profile',
    editProfileBtn: 'Edit Profile',
    addFriend: 'Add Friend',
    addFriendBtn: 'Add Friend',
    cancelRequest: 'Cancel Request',
    cancelRequestBtn: 'Cancel Request',
    accept: 'Accept',
    acceptBtn: 'Accept',
    decline: 'Decline',
    declineBtn: 'Decline',
    friends: 'Friends',
    friendsBtn: 'Friends',
    friendsTitle: 'Friends',
    report: 'Report',
    reportBtn: 'Report',
    booksReadThisYear: 'Books Read This Year',
    booksReadThisYearLabel: 'Books Read This Year',
    goalPercent: '{{ n }}% of {{ year }} goal',
    editGoal: 'Edit goal',
    editGoalBtn: 'Edit goal',
    saveGoal: 'Save',
    saveBtn: 'Save',
    cancelGoal: 'Cancel',
    cancelBtn: 'Cancel',
    totalRated: 'Total Rated',
    totalRatedLabel: 'Total Rated',
    booksWithRatings: 'Books with ratings',
    booksWithRatingsDesc: 'Books with ratings',
    currentlyReading: 'Currently Reading',
    currentlyReadingTitle: 'Currently Reading',
    currentlyReadingDesc: 'Books in progress right now.',
    readingBadge: 'Reading',
    recentPosts: 'Recent Posts',
    recentPostsTitle: 'Recent Posts',
    findFriends: 'Find Friends',
    findFriendsTitle: 'Find Friends',
    findFriendsSearchPlaceholder: 'Search by name or username…',
    searchPlaceholder: 'Search by name or username…',
    searchingState: 'Searching…',
    searchingMsg: 'Searching…',
    searchNoResults: 'No users found for "{{ query }}"',
    viewButton: 'View',
    viewBtn: 'View',
    sentLabel: 'Sent',
    addFriendSearch: 'Add Friend',
    friendRequests: 'Friend Requests',
    friendRequestsTitle: 'Friend Requests',
    friendsList: 'Friends',
    emptyFriends: 'No friends yet. Find readers to connect with!',
    noFriendsYetMsg: 'No friends yet. Find readers to connect with!',
    discoverBooks: 'Discover Books',
    discoverBooksBtn: 'Discover Books',
    mostLiked: 'Most Liked',
    mostLikedDesc: 'Five-star reads — the ones that stayed with you.',
    inBetween: 'In Between',
    inBetweenDesc: 'Decent reads — not bad, not unforgettable.',
    leastLiked: 'Least Liked',
    leastLikedDesc: 'Books you gave 1–2 stars.',
    noRatedBooks: 'No rated books yet. Start reading and rating!',
    findBooks: 'Find Books',
    editPanelTitle: 'Edit Profile',
    displayName: 'Display Name',
    namePlaceholder: 'Your name',
    username: 'Username',
    usernamePlaceholder: 'username',
    bio: 'Bio',
    bioPlaceholder: 'Tell readers about yourself…',
    cancelEdit: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving…',
    savingMsg: 'Saving…',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    copyright: '© 2026 ReadTrack. All rights reserved.',
    avatarAlt: 'Change profile photo',
    errorImageFile: 'Please select an image file.',
    errorImageSize: 'Image must be under 5 MB.',
    errorUpload: 'Could not upload photo. Please try again.',
    errorFriendSend: 'Could not send friend request. Please try again.',
    errorFriendCancel: 'Could not cancel request. Please try again.',
    errorFriendAccept: 'Could not accept request. Please try again.',
    errorFriendDecline: 'Could not decline request. Please try again.',
    errorUnfriend: 'Could not remove friend. Please try again.',
    noUsersFoundMsg: 'No users found',
    profileNotFoundMsg: 'Profile not found',
    friendCountDesc: 'Connected readers',
  },
  ar: {
    ownTitle: 'ملفي الشخصي',
    myProfileTitle: 'ملفي الشخصي',
    otherTitle: 'الملف الشخصي',
    profileTitle: 'الملف الشخصي',
    goHome: 'الرجوع للرئيسية',
    goHomeBtn: 'الرجوع للرئيسية',
    joinedSince: 'القراءة منذ {{ date }}',
    readingSincePrefix: 'القراءة منذ ',
    editProfile: 'تعديل الملف الشخصي',
    editProfileBtn: 'تعديل الملف الشخصي',
    addFriend: 'إضافة صديق',
    addFriendBtn: 'إضافة صديق',
    cancelRequest: 'إلغاء الطلب',
    cancelRequestBtn: 'إلغاء الطلب',
    accept: 'قبول',
    acceptBtn: 'قبول',
    decline: 'رفض',
    declineBtn: 'رفض',
    friends: 'الأصدقاء',
    friendsBtn: 'الأصدقاء',
    friendsTitle: 'الأصدقاء',
    report: 'الإبلاغ عن',
    reportBtn: 'الإبلاغ عن',
    booksReadThisYear: 'الكتب المقروءة هذا العام',
    booksReadThisYearLabel: 'الكتب المقروءة هذا العام',
    goalPercent: '{{ n }}% من الهدف {{ year }}',
    editGoal: 'تعديل الهدف',
    editGoalBtn: 'تعديل الهدف',
    saveGoal: 'حفظ',
    saveBtn: 'حفظ',
    cancelGoal: 'إلغاء',
    cancelBtn: 'إلغاء',
    totalRated: 'إجمالي المقيمة',
    totalRatedLabel: 'إجمالي المقيمة',
    booksWithRatings: 'الكتب المقيمة',
    booksWithRatingsDesc: 'الكتب المقيمة',
    currentlyReading: 'قيد القراءة حالياً',
    currentlyReadingTitle: 'قيد القراءة حالياً',
    currentlyReadingDesc: 'الكتب التي تقرأها الآن.',
    readingBadge: 'قيد القراءة',
    recentPosts: 'آخر المنشورات',
    recentPostsTitle: 'آخر المنشورات',
    findFriends: 'البحث عن أصدقاء',
    findFriendsTitle: 'البحث عن أصدقاء',
    findFriendsSearchPlaceholder: 'ابحث حسب الاسم أو اسم المستخدم…',
    searchPlaceholder: 'ابحث حسب الاسم أو اسم المستخدم…',
    searchingState: 'جاري البحث…',
    searchingMsg: 'جاري البحث…',
    searchNoResults: 'لم يتم العثور على مستخدمين لـ "{{ query }}"',
    viewButton: 'عرض',
    viewBtn: 'عرض',
    sentLabel: 'مُرسلة',
    addFriendSearch: 'إضافة صديق',
    friendRequests: 'طلبات الصداقة',
    friendRequestsTitle: 'طلبات الصداقة',
    friendsList: 'الأصدقاء',
    emptyFriends: 'لا توجد أصدقاء حتى الآن. ابحث عن قراء للاتصال بهم!',
    noFriendsYetMsg: 'لا توجد أصدقاء حتى الآن. ابحث عن قراء للاتصال بهم!',
    discoverBooks: 'اكتشف الكتب',
    discoverBooksBtn: 'اكتشف الكتب',
    mostLiked: 'الأكثر إعجاباً',
    mostLikedDesc: 'الكتب الخمس نجوم — تلك التي بقيت معك.',
    inBetween: 'متوسطة',
    inBetweenDesc: 'قراءات جيدة — ليست سيئة ولا لا تُنسى.',
    leastLiked: 'الأقل إعجاباً',
    leastLikedDesc: 'الكتب التي أعطيتها نجمة أو نجمتين.',
    noRatedBooks: 'لا توجد كتب مقيمة حتى الآن. ابدأ في القراءة والتقييم!',
    findBooks: 'ابحث عن الكتب',
    editPanelTitle: 'تعديل الملف الشخصي',
    displayName: 'اسم العرض',
    namePlaceholder: 'اسمك',
    username: 'اسم المستخدم',
    usernamePlaceholder: 'اسم المستخدم',
    bio: 'السيرة الذاتية',
    bioPlaceholder: 'أخبر القراء عن نفسك…',
    cancelEdit: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    saving: 'جاري الحفظ…',
    savingMsg: 'جاري الحفظ…',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة',
    copyright: '© 2026 ReadTrack. جميع الحقوق محفوظة.',
    avatarAlt: 'تغيير صورة الملف الشخصي',
    errorImageFile: 'يرجى اختيار ملف صورة.',
    errorImageSize: 'يجب أن تكون الصورة أقل من 5 ميجابايت.',
    errorUpload: 'تعذر تحميل الصورة. حاول مرة أخرى.',
    errorFriendSend: 'تعذر إرسال طلب الصداقة. حاول مرة أخرى.',
    errorFriendCancel: 'تعذر إلغاء الطلب. حاول مرة أخرى.',
    errorFriendAccept: 'تعذر قبول الطلب. حاول مرة أخرى.',
    errorFriendDecline: 'تعذر رفض الطلب. حاول مرة أخرى.',
    errorUnfriend: 'تعذر إزالة الصديق. حاول مرة أخرى.',
    noUsersFoundMsg: 'لم يتم العثور على مستخدمين',
    profileNotFoundMsg: 'الملف الشخصي غير موجود',
    friendCountDesc: 'قراء متصلون',
  },
  fr: {
    ownTitle: 'Mon Profil',
    myProfileTitle: 'Mon Profil',
    otherTitle: 'Profil',
    profileTitle: 'Profil',
    goHome: 'Aller à l\'accueil',
    goHomeBtn: 'Aller à l\'accueil',
    joinedSince: 'Lecteur depuis {{ date }}',
    readingSincePrefix: 'Lecteur depuis ',
    editProfile: 'Modifier le profil',
    editProfileBtn: 'Modifier le profil',
    addFriend: 'Ajouter un ami',
    addFriendBtn: 'Ajouter un ami',
    cancelRequest: 'Annuler la demande',
    cancelRequestBtn: 'Annuler la demande',
    accept: 'Accepter',
    acceptBtn: 'Accepter',
    decline: 'Refuser',
    declineBtn: 'Refuser',
    friends: 'Amis',
    friendsBtn: 'Amis',
    friendsTitle: 'Amis',
    report: 'Signaler',
    reportBtn: 'Signaler',
    booksReadThisYear: 'Livres lus cette année',
    booksReadThisYearLabel: 'Livres lus cette année',
    goalPercent: '{{ n }}% de l\'objectif {{ year }}',
    editGoal: 'Modifier l\'objectif',
    editGoalBtn: 'Modifier l\'objectif',
    saveGoal: 'Enregistrer',
    saveBtn: 'Enregistrer',
    cancelGoal: 'Annuler',
    cancelBtn: 'Annuler',
    totalRated: 'Total noté',
    totalRatedLabel: 'Total noté',
    booksWithRatings: 'Livres notés',
    booksWithRatingsDesc: 'Livres notés',
    currentlyReading: 'En cours de lecture',
    currentlyReadingTitle: 'En cours de lecture',
    currentlyReadingDesc: 'Les livres que vous lisez actuellement.',
    readingBadge: 'En lecture',
    recentPosts: 'Messages récents',
    recentPostsTitle: 'Messages récents',
    findFriends: 'Trouver des amis',
    findFriendsTitle: 'Trouver des amis',
    findFriendsSearchPlaceholder: 'Rechercher par nom ou nom d\'utilisateur…',
    searchPlaceholder: 'Rechercher par nom ou nom d\'utilisateur…',
    searchingState: 'Recherche en cours…',
    searchingMsg: 'Recherche en cours…',
    searchNoResults: 'Aucun utilisateur trouvé pour "{{ query }}"',
    viewButton: 'Afficher',
    viewBtn: 'Afficher',
    sentLabel: 'Envoyée',
    addFriendSearch: 'Ajouter un ami',
    friendRequests: 'Demandes d\'amitié',
    friendRequestsTitle: 'Demandes d\'amitié',
    friendsList: 'Amis',
    emptyFriends: 'Aucun ami pour le moment. Trouvez des lecteurs à suivre !',
    noFriendsYetMsg: 'Aucun ami pour le moment. Trouvez des lecteurs à suivre !',
    discoverBooks: 'Découvrir des livres',
    discoverBooksBtn: 'Découvrir des livres',
    mostLiked: 'Les plus appréciés',
    mostLikedDesc: 'Livres cinq étoiles — ceux qui vous sont restés.',
    inBetween: 'Entre les deux',
    inBetweenDesc: 'Bonnes lectures — pas mauvaises, pas inoubliables.',
    leastLiked: 'Les moins appréciés',
    leastLikedDesc: 'Livres auxquels vous avez donné 1 ou 2 étoiles.',
    noRatedBooks: 'Aucun livre noté pour le moment. Commencez à lire et à noter !',
    findBooks: 'Trouver des livres',
    editPanelTitle: 'Modifier le profil',
    displayName: 'Nom affiché',
    namePlaceholder: 'Votre nom',
    username: 'Nom d\'utilisateur',
    usernamePlaceholder: 'nom_utilisateur',
    bio: 'Biographie',
    bioPlaceholder: 'Parlez-nous de vous…',
    cancelEdit: 'Annuler',
    saveChanges: 'Enregistrer les modifications',
    saving: 'Enregistrement en cours…',
    savingMsg: 'Enregistrement en cours…',
    privacyPolicy: 'Politique de confidentialité',
    termsOfService: 'Conditions d\'utilisation',
    copyright: '© 2026 ReadTrack. Tous droits réservés.',
    avatarAlt: 'Modifier la photo de profil',
    errorImageFile: 'Veuillez sélectionner un fichier image.',
    errorImageSize: 'L\'image doit faire moins de 5 Mo.',
    errorUpload: 'Impossible de télécharger la photo. Réessayez.',
    errorFriendSend: 'Impossible d\'envoyer la demande d\'amitié. Réessayez.',
    errorFriendCancel: 'Impossible d\'annuler la demande. Réessayez.',
    errorFriendAccept: 'Impossible d\'accepter la demande. Réessayez.',
    errorFriendDecline: 'Impossible de refuser la demande. Réessayez.',
    errorUnfriend: 'Impossible de supprimer l\'ami. Réessayez.',
    noUsersFoundMsg: 'Aucun utilisateur trouvé',
    profileNotFoundMsg: 'Profil non trouvé',
    friendCountDesc: 'Lecteurs connectés',
  },
};
