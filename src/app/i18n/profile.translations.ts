import { LanguageCode } from './language.model';

export interface ProfileCopy {
  ownTitle: string;
  myProfileTitle: string;
  otherTitle: string;
  profileTitle: string;
  goHome: string;
  goHomeBtn: string;
  profileUnavailable: string;
  joinedSince: string;
  readingSincePrefix: string;
  editProfile: string;
  editProfileBtn: string;
  removePhotoBtn: string;
  removePhotoConfirm: string;
  removePhotoError: string;
  addPhotoBtn: string;
  changePhotoBtn: string;
  editPhotoLabel: string;
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
  seeAllBtn: string;
  showLessBtn: string;
  bookUnit: string;
  booksUnit: string;
  onlineLabel: string;
  offlineLabel: string;
  dangerZone: string;
  deleteAccount: string;
  deleteAccountWarning: string;
  deleteAccountConfirm: string;
  deleteAccountError: string;
  deletingAccount: string;
  report: string;
  reportBtn: string;
  booksReadThisYear: string;
  booksReadThisYearLabel: string;
  goalPercent: string;
  editGoal: string;
  editGoalBtn: string;
  goalProgress: string;
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
  email: string;
  emailReadonlyNote: string;
  genresMinError: string;
  bio: string;
  bioPlaceholder: string;
  favoriteGenres: string;
  favoriteGenresHint: string;
  privateAccountLabel: string;
  privateAccountHint: string;
  privateAccountNotice: string;
  cancelEdit: string;
  saveChanges: string;
  saving: string;
  savingMsg: string;
  usernameTaken: string;
  saveProfileError: string;
  friendActionFailed: string;
  avatarInvalidType: string;
  avatarTooLarge: string;
  avatarUploadError: string;
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
  blockBtn: string;
  unblockBtn: string;
  blockedLabel: string;
  blockConfirm: string;
  blockError: string;
  unblockError: string;
  reportModalTitle: string;
  reportReasonLabel: string;
  reportDescriptionLabel: string;
  reportDescriptionPlaceholder: string;
  reportSubmitBtn: string;
  reportCancelBtn: string;
  reportSubmitting: string;
  reportSubmitted: string;
  reportError: string;
  reasonSpam: string;
  reasonHarassment: string;
  reasonInappropriate: string;
  reasonImpersonation: string;
  reasonOther: string;
}

export const PROFILE_COPY: Record<LanguageCode, ProfileCopy> = {
  en: {
    ownTitle: 'My Profile',
    myProfileTitle: 'My Profile',
    otherTitle: 'Profile',
    profileTitle: 'Profile',
    goHome: 'Go home',
    goHomeBtn: 'Go home',
    profileUnavailable: 'This profile is not available.',
    joinedSince: 'Reading since {{ date }}',
    readingSincePrefix: 'Reading since ',
    editProfile: 'Edit Profile',
    editProfileBtn: 'Edit Profile',
    removePhotoBtn: 'Remove photo',
    removePhotoConfirm: 'Remove your profile photo?',
    removePhotoError: 'Could not remove photo. Please try again.',
    addPhotoBtn: 'Add photo',
    changePhotoBtn: 'Change photo',
    editPhotoLabel: 'Edit profile photo',
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
    seeAllBtn: 'See all',
    showLessBtn: 'Show less',
    bookUnit: 'book',
    booksUnit: 'books',
    onlineLabel: 'Online',
    offlineLabel: 'Offline',
    dangerZone: 'Danger zone',
    deleteAccount: 'Delete account',
    deleteAccountWarning: 'Permanently delete your account and all your data. This cannot be undone.',
    deleteAccountConfirm: 'This permanently deletes your account and all your data (books, posts, friends). This cannot be undone. Continue?',
    deleteAccountError: 'Could not delete your account. Please try again.',
    deletingAccount: 'Deleting…',
    report: 'Report',
    reportBtn: 'Report',
    booksReadThisYear: 'Books Read This Year',
    booksReadThisYearLabel: 'Books Read This Year',
    goalPercent: '{{ n }}% of {{ year }} goal',
    editGoal: 'Edit goal',
    editGoalBtn: 'Edit goal',
    goalProgress: '{percent}% of {year} goal',
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
    email: 'Email',
    emailReadonlyNote: 'Email cannot be changed. Contact support if needed.',
    genresMinError: 'Please select at least 3 genres.',
    bio: 'Bio',
    bioPlaceholder: 'Tell readers about yourself…',
    favoriteGenres: 'Favorite genres',
    favoriteGenresHint: 'Pick the genres you love — they shape your recommendations.',
    privateAccountLabel: 'Private account',
    privateAccountHint: 'Only friends can see your profile, posts, and comments.',
    privateAccountNotice: 'This account is private. Add them as a friend to see their profile.',
    cancelEdit: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving…',
    savingMsg: 'Saving…',
    usernameTaken: 'That username is already taken. Please choose another.',
    saveProfileError: 'Could not save your changes. Please try again.',
    friendActionFailed: 'Could not complete that action. Please try again.',
    avatarInvalidType: 'Please select an image file.',
    avatarTooLarge: 'Image must be under 5 MB.',
    avatarUploadError: 'Could not upload photo. Please try again.',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    copyright: '© {year} ReadTrack. All rights reserved.',
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
    blockBtn: 'Block',
    unblockBtn: 'Unblock',
    blockedLabel: 'Blocked',
    blockConfirm: 'Block this user? They will no longer be able to send you friend requests.',
    blockError: 'Could not block user. Please try again.',
    unblockError: 'Could not unblock user. Please try again.',
    reportModalTitle: 'Report user',
    reportReasonLabel: 'Reason',
    reportDescriptionLabel: 'Additional details (optional)',
    reportDescriptionPlaceholder: 'Tell us more about what happened…',
    reportSubmitBtn: 'Submit report',
    reportCancelBtn: 'Cancel',
    reportSubmitting: 'Submitting…',
    reportSubmitted: 'Report submitted. Thank you.',
    reportError: 'Could not submit report. Please try again.',
    reasonSpam: 'Spam',
    reasonHarassment: 'Harassment',
    reasonInappropriate: 'Inappropriate content',
    reasonImpersonation: 'Impersonation',
    reasonOther: 'Other',
  },
  ar: {
    ownTitle: 'ملفي الشخصي',
    myProfileTitle: 'ملفي الشخصي',
    otherTitle: 'الملف الشخصي',
    profileTitle: 'الملف الشخصي',
    goHome: 'الرجوع للرئيسية',
    goHomeBtn: 'الرجوع للرئيسية',
    profileUnavailable: 'هذا الملف الشخصي غير متاح.',
    joinedSince: 'القراءة منذ {{ date }}',
    readingSincePrefix: 'القراءة منذ ',
    editProfile: 'تعديل الملف الشخصي',
    editProfileBtn: 'تعديل الملف الشخصي',
    removePhotoBtn: 'إزالة الصورة',
    removePhotoConfirm: 'إزالة صورة ملفك الشخصي؟',
    removePhotoError: 'تعذّر إزالة الصورة. حاول مرة أخرى.',
    addPhotoBtn: 'إضافة صورة',
    changePhotoBtn: 'تغيير الصورة',
    editPhotoLabel: 'تعديل صورة الملف الشخصي',
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
    seeAllBtn: 'عرض الكل',
    showLessBtn: 'عرض أقل',
    bookUnit: 'كتاب',
    booksUnit: 'كتب',
    onlineLabel: 'متصل',
    offlineLabel: 'غير متصل',
    dangerZone: 'منطقة الخطر',
    deleteAccount: 'حذف الحساب',
    deleteAccountWarning: 'حذف حسابك وجميع بياناتك نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
    deleteAccountConfirm: 'سيؤدي هذا إلى حذف حسابك وجميع بياناتك نهائيًا (الكتب والمنشورات والأصدقاء). لا يمكن التراجع. هل تريد المتابعة؟',
    deleteAccountError: 'تعذر حذف حسابك. حاول مرة أخرى.',
    deletingAccount: 'جارٍ الحذف…',
    report: 'الإبلاغ عن',
    reportBtn: 'الإبلاغ عن',
    booksReadThisYear: 'الكتب المقروءة هذا العام',
    booksReadThisYearLabel: 'الكتب المقروءة هذا العام',
    goalPercent: '{{ n }}% من الهدف {{ year }}',
    editGoal: 'تعديل الهدف',
    editGoalBtn: 'تعديل الهدف',
    goalProgress: '{percent}٪ من هدف {year}',
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
    email: 'البريد الإلكتروني',
    emailReadonlyNote: 'لا يمكن تغيير البريد الإلكتروني. تواصل مع الدعم إذا لزم الأمر.',
    genresMinError: 'يرجى اختيار 3 أنواع على الأقل.',
    bio: 'السيرة الذاتية',
    bioPlaceholder: 'أخبر القراء عن نفسك…',
    favoriteGenres: 'الأنواع المفضلة',
    favoriteGenresHint: 'اختر الأنواع التي تحبها — فهي تشكّل توصياتك.',
    privateAccountLabel: 'حساب خاص',
    privateAccountHint: 'يمكن للأصدقاء فقط رؤية ملفك ومنشوراتك وتعليقاتك.',
    privateAccountNotice: 'هذا الحساب خاص. أضِفه كصديق لرؤية ملفه الشخصي.',
    cancelEdit: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    saving: 'جاري الحفظ…',
    savingMsg: 'جاري الحفظ…',
    usernameTaken: 'اسم المستخدم هذا مستخدم بالفعل. يرجى اختيار اسم آخر.',
    saveProfileError: 'تعذّر حفظ التغييرات. حاول مرة أخرى.',
    friendActionFailed: 'تعذّر إتمام هذا الإجراء. حاول مرة أخرى.',
    avatarInvalidType: 'يرجى اختيار ملف صورة.',
    avatarTooLarge: 'يجب أن تكون الصورة أقل من 5 ميغابايت.',
    avatarUploadError: 'تعذّر رفع الصورة. حاول مرة أخرى.',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة',
    copyright: '© {year} ReadTrack. جميع الحقوق محفوظة.',
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
    blockBtn: 'حظر',
    unblockBtn: 'إلغاء الحظر',
    blockedLabel: 'محظور',
    blockConfirm: 'حظر هذا المستخدم؟ لن يتمكن من إرسال طلبات صداقة إليك بعد الآن.',
    blockError: 'تعذر حظر المستخدم. حاول مرة أخرى.',
    unblockError: 'تعذر إلغاء حظر المستخدم. حاول مرة أخرى.',
    reportModalTitle: 'الإبلاغ عن مستخدم',
    reportReasonLabel: 'السبب',
    reportDescriptionLabel: 'تفاصيل إضافية (اختياري)',
    reportDescriptionPlaceholder: 'أخبرنا المزيد عما حدث…',
    reportSubmitBtn: 'إرسال البلاغ',
    reportCancelBtn: 'إلغاء',
    reportSubmitting: 'جاري الإرسال…',
    reportSubmitted: 'تم إرسال البلاغ. شكراً لك.',
    reportError: 'تعذر إرسال البلاغ. حاول مرة أخرى.',
    reasonSpam: 'بريد مزعج',
    reasonHarassment: 'تحرش',
    reasonInappropriate: 'محتوى غير لائق',
    reasonImpersonation: 'انتحال شخصية',
    reasonOther: 'أخرى',
  },
  fr: {
    ownTitle: 'Mon Profil',
    myProfileTitle: 'Mon Profil',
    otherTitle: 'Profil',
    profileTitle: 'Profil',
    goHome: 'Aller à l\'accueil',
    goHomeBtn: 'Aller à l\'accueil',
    profileUnavailable: 'Ce profil n\'est pas disponible.',
    joinedSince: 'Lecteur depuis {{ date }}',
    readingSincePrefix: 'Lecteur depuis ',
    editProfile: 'Modifier le profil',
    editProfileBtn: 'Modifier le profil',
    removePhotoBtn: 'Supprimer la photo',
    removePhotoConfirm: 'Supprimer votre photo de profil ?',
    removePhotoError: 'Impossible de supprimer la photo. Veuillez reessayer.',
    addPhotoBtn: 'Ajouter une photo',
    changePhotoBtn: 'Changer la photo',
    editPhotoLabel: 'Modifier la photo de profil',
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
    seeAllBtn: 'Voir tout',
    showLessBtn: 'Voir moins',
    bookUnit: 'livre',
    booksUnit: 'livres',
    onlineLabel: 'En ligne',
    offlineLabel: 'Hors ligne',
    dangerZone: 'Zone de danger',
    deleteAccount: 'Supprimer le compte',
    deleteAccountWarning: 'Supprimez définitivement votre compte et toutes vos données. Cette action est irréversible.',
    deleteAccountConfirm: 'Cela supprime définitivement votre compte et toutes vos données (livres, publications, amis). Action irréversible. Continuer ?',
    deleteAccountError: 'Impossible de supprimer votre compte. Réessayez.',
    deletingAccount: 'Suppression…',
    report: 'Signaler',
    reportBtn: 'Signaler',
    booksReadThisYear: 'Livres lus cette année',
    booksReadThisYearLabel: 'Livres lus cette année',
    goalPercent: '{{ n }}% de l\'objectif {{ year }}',
    editGoal: 'Modifier l\'objectif',
    editGoalBtn: 'Modifier l\'objectif',
    goalProgress: '{percent}% de l\'objectif {year}',
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
    email: 'E-mail',
    emailReadonlyNote: 'L\'e-mail ne peut pas être modifié. Contactez le support si nécessaire.',
    genresMinError: 'Veuillez sélectionner au moins 3 genres.',
    bio: 'Biographie',
    bioPlaceholder: 'Parlez-nous de vous…',
    favoriteGenres: 'Genres favoris',
    favoriteGenresHint: 'Choisissez les genres que vous aimez — ils façonnent vos recommandations.',
    privateAccountLabel: 'Compte prive',
    privateAccountHint: 'Seuls vos amis peuvent voir votre profil, vos messages et vos commentaires.',
    privateAccountNotice: 'Ce compte est prive. Ajoutez cette personne en ami pour voir son profil.',
    cancelEdit: 'Annuler',
    saveChanges: 'Enregistrer les modifications',
    saving: 'Enregistrement en cours…',
    savingMsg: 'Enregistrement en cours…',
    usernameTaken: 'Ce nom d utilisateur est deja pris. Veuillez en choisir un autre.',
    saveProfileError: 'Impossible d enregistrer les modifications. Veuillez reessayer.',
    friendActionFailed: 'Impossible d\'effectuer cette action. Veuillez réessayer.',
    avatarInvalidType: 'Veuillez sélectionner un fichier image.',
    avatarTooLarge: 'L\'image doit faire moins de 5 Mo.',
    avatarUploadError: 'Impossible de téléverser la photo. Veuillez réessayer.',
    privacyPolicy: 'Politique de confidentialité',
    termsOfService: 'Conditions d\'utilisation',
    copyright: '© {year} ReadTrack. Tous droits réservés.',
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
    blockBtn: 'Bloquer',
    unblockBtn: 'Débloquer',
    blockedLabel: 'Bloqué',
    blockConfirm: 'Bloquer cet utilisateur ? Il ne pourra plus vous envoyer de demandes d\'amitié.',
    blockError: 'Impossible de bloquer cet utilisateur. Réessayez.',
    unblockError: 'Impossible de débloquer cet utilisateur. Réessayez.',
    reportModalTitle: 'Signaler un utilisateur',
    reportReasonLabel: 'Motif',
    reportDescriptionLabel: 'Détails supplémentaires (facultatif)',
    reportDescriptionPlaceholder: 'Dites-nous-en plus sur ce qui s\'est passé…',
    reportSubmitBtn: 'Envoyer le signalement',
    reportCancelBtn: 'Annuler',
    reportSubmitting: 'Envoi…',
    reportSubmitted: 'Signalement envoyé. Merci.',
    reportError: 'Impossible d\'envoyer le signalement. Réessayez.',
    reasonSpam: 'Spam',
    reasonHarassment: 'Harcèlement',
    reasonInappropriate: 'Contenu inapproprié',
    reasonImpersonation: 'Usurpation d\'identité',
    reasonOther: 'Autre',
  },
};
