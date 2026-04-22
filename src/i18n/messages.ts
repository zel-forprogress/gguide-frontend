import type { AppLocale } from './locale';

export type MessageKey =
  | 'appName'
  | 'localeZh'
  | 'localeEn'
  | 'processing'
  | 'favorite'
  | 'favorited'
  | 'uncategorized'
  | 'comingSoon'
  | 'noRating'
  | 'home'
  | 'recentlyViewed'
  | 'favorites'
  | 'gameHub'
  | 'gameHubTitle'
  | 'gameHubSubtitle'
  | 'searchGameHub'
  | 'allCategories'
  | 'hubStatGames'
  | 'hubStatCategories'
  | 'hubStatHighRated'
  | 'hubTopRatedTitle'
  | 'hubLatestTitle'
  | 'hubBrowseTitle'
  | 'hubBrowseSubtitle'
  | 'hubNoMatchesTitle'
  | 'hubNoMatchesDesc'
  | 'aiAssistant'
  | 'aiAssistantPending'
  | 'searchRecommendedGames'
  | 'searchRecentGames'
  | 'searchFavoriteGames'
  | 'guestMode'
  | 'loginOrRegister'
  | 'profileSettings'
  | 'logout'
  | 'welcomeBack'
  | 'guestWelcomeTitle'
  | 'loggedInIntro'
  | 'guestIntro'
  | 'guestBannerTitle'
  | 'guestBannerDesc'
  | 'sessionExpiredTitle'
  | 'sessionExpiredMessage'
  | 'goLogin'
  | 'syncRecentViews'
  | 'todayPicks'
  | 'forYou'
  | 'highScoreFirst'
  | 'todayRecommendationTitle'
  | 'todayRecommendationSubtitle'
  | 'selectedPick'
  | 'viewDetails'
  | 'clickCardForDetails'
  | 'noDescription'
  | 'forYouTitle'
  | 'forYouFavoriteSubtitle'
  | 'forYouRecentSubtitle'
  | 'forYouTopSubtitle'
  | 'preparingRecommendations'
  | 'noRecommendationMatchesTitle'
  | 'noRecommendationMatchesDesc'
  | 'myLibrary'
  | 'loadingContent'
  | 'emptyStateTitle'
  | 'backHome'
  | 'continueBrowsing'
  | 'recentlyViewedSubtitle'
  | 'recentlyViewedEmptyTitle'
  | 'recentlyViewedEmptyDesc'
  | 'favoritesSubtitle'
  | 'favoritesEmptyTitle'
  | 'favoritesEmptyDesc'
  | 'favoritesNoMatchTitle'
  | 'favoritesNoMatchDesc'
  | 'loginToSyncFavoritesTitle'
  | 'loginToSyncFavoritesDesc'
  | 'loginToSyncHistoryTitle'
  | 'loginToSyncHistoryDesc'
  | 'discoverYourWorld'
  | 'landingDescription'
  | 'loginTitle'
  | 'registerTitle'
  | 'usernamePlaceholder'
  | 'passwordPlaceholder'
  | 'login'
  | 'register'
  | 'registerSuccess'
  | 'missingUsernameOrPassword'
  | 'missingToken'
  | 'actionFailed'
  | 'loginFailed'
  | 'registerFailed'
  | 'invalidCredentials'
  | 'usernameAlreadyExists'
  | 'noAccount'
  | 'hasAccount'
  | 'gameDetail'
  | 'invalidGameId'
  | 'loadingGameDetail'
  | 'gameNotFound'
  | 'gameUnavailable'
  | 'retry'
  | 'category'
  | 'region'
  | 'releaseDate'
  | 'overallRating'
  | 'downloadNow'
  | 'watchTrailer'
  | 'backToList'
  | 'guestDetailTip'
  | 'gameIntroduction'
  | 'quickFacts'
  | 'trailerAvailable'
  | 'trailerUnavailable'
  | 'downloadAvailable'
  | 'downloadUnavailable'
  | 'profilePageTitle'
  | 'profilePageSubtitle'
  | 'sessionStatusLabel'
  | 'sessionStatusActive'
  | 'profileOverviewTitle'
  | 'profileOverviewDesc'
  | 'usernameLabel'
  | 'languageCurrent'
  | 'tokenStatusLabel'
  | 'tokenStatusHealthy'
  | 'languagePreferenceTitle'
  | 'languagePreferenceDesc'
  | 'profileActivityTitle'
  | 'profileActivityDesc'
  | 'profileFavoriteCount'
  | 'profileRecentCount'
  | 'profileTopCategory'
  | 'profileQuickActionsTitle'
  | 'profileQuickActionsDesc';

type Messages = Record<string, string>;

export const messages: Record<AppLocale, Messages> = {
  'zh-CN': {
    appName: 'G-Guide',
    localeZh: '中文',
    localeEn: 'English',
    processing: '处理中...',
    favorite: '收藏',
    favorited: '已收藏',
    uncategorized: '未分类',
    comingSoon: '待公布',
    noRating: '暂无评分',
    home: '首页',
    recentlyViewed: '最近查看',
    favorites: '我的收藏',
    gameHub: '游戏广场',
    gameHubTitle: '按分类逛一逛你的游戏库',
    gameHubSubtitle: '这里的分类展示和筛选基于稳定的分类码，切换语言时显示文案会一起改变。',
    searchGameHub: '搜索游戏广场',
    allCategories: '全部分类',
    hubStatGames: '游戏总数',
    hubStatCategories: '可用分类',
    hubStatHighRated: '高分精选',
    hubTopRatedTitle: '本区高分',
    hubLatestTitle: '最新上架',
    hubBrowseTitle: '分类浏览',
    hubBrowseSubtitle: '按分类码筛选，按当前语言显示名称。',
    hubNoMatchesTitle: '这个分类下还没有匹配结果',
    hubNoMatchesDesc: '可以切换到其他分类，或者换一个关键词继续找。',
    aiAssistantPending: 'AI 助手（敬请期待）',
    searchRecommendedGames: '搜索推荐的游戏',
    searchRecentGames: '搜索最近查看的游戏',
    searchFavoriteGames: '搜索收藏的游戏',
    guestMode: '游客模式',
    loginOrRegister: '登录 / 注册',
    profileSettings: '个人设置',
    logout: '退出登录',
    welcomeBack: '欢迎回来，继续挑今晚要玩的游戏',
    guestWelcomeTitle: '先逛首页，想登录时再登录',
    loggedInIntro: '今天的推荐、收藏和最近查看都已经准备好了，继续往下看看有没有新的心动选择。',
    guestIntro: '你现在可以直接以游客身份浏览游戏内容，想同步收藏或最近查看时再登录。',
    guestBannerTitle: '当前为游客浏览模式',
    guestBannerDesc: '你可以先看列表和详情，登录后再同步收藏、最近查看等个人能力。',
    goLogin: '去登录',
    syncRecentViews: '同步最近查看',
    todayPicks: '今日推荐',
    forYou: '为你推荐',
    highScoreFirst: '高分优先',
    todayRecommendationTitle: '今日推荐',
    todayRecommendationSubtitle: '先快速看一眼今天最值得点开的几款游戏，再决定要不要深入详情页。',
    selectedPick: '精选推荐',
    viewDetails: '查看详情',
    clickCardForDetails: '点击卡片查看完整详情',
    noDescription: '这款游戏暂时还没有补充简介。',
    forYouTitle: '为你推荐',
    forYouFavoriteSubtitle: '优先参考你的收藏偏好，从同类型里筛出更值得继续看的游戏。',
    forYouRecentSubtitle: '根据你最近浏览过的内容延展推荐，方便继续顺着兴趣往下逛。',
    forYouTopSubtitle: '你还没有留下偏好，这里先按当前评分更高的游戏给你推荐。',
    preparingRecommendations: '正在整理推荐结果...',
    noRecommendationMatchesTitle: '没有找到匹配的推荐结果',
    noRecommendationMatchesDesc: '可以换个关键词，或者先打开几款游戏详情，让推荐更快学到你的偏好。',
    myLibrary: '我的库',
    loadingContent: '正在加载内容...',
    emptyStateTitle: '这里还是空的',
    backHome: '返回首页',
    continueBrowsing: '继续浏览',
    recentlyViewedSubtitle: '你最近点进详情页的游戏都会记录在这里，方便随时接着看。',
    recentlyViewedEmptyTitle: '你最近还没有查看过游戏',
    recentlyViewedEmptyDesc: '点开任意游戏详情页，这里就会开始记录你的浏览轨迹。',
    favoritesSubtitle: '把想继续了解的游戏先收进这里，之后从详情页或首页都可以继续管理。',
    favoritesEmptyTitle: '你还没有收藏游戏',
    favoritesEmptyDesc: '回到首页点一下“收藏”，这里就会慢慢变成你的游戏清单。',
    favoritesNoMatchTitle: '没有找到匹配的收藏',
    favoritesNoMatchDesc: '试试换个搜索词，或者回到首页继续挑选想保存的游戏。',
    loginToSyncFavoritesTitle: '登录后才能同步收藏',
    loginToSyncFavoritesDesc: '你现在已经可以浏览游戏，登录后再把喜欢的内容保存到个人收藏夹里。',
    loginToSyncHistoryTitle: '登录后可同步数据',
    loginToSyncHistoryDesc: '登录后你可以在不同设备之间同步这些内容。',
    discoverYourWorld: '探索属于你的游戏世界',
    landingDescription: 'G-Guide 是一个专为游戏爱好者设计的导航平台。在这里，你可以按分类轻松找到心仪的游戏，管理你的游戏库，发现更多精彩内容。',
    loginTitle: '欢迎回来',
    registerTitle: '创建新账号',
    usernamePlaceholder: '用户名（测试账号：admin）',
    passwordPlaceholder: '密码（测试密码：admin123）',
    login: '登录',
    register: '注册',
    registerSuccess: '注册成功，请登录。',
    missingUsernameOrPassword: '请输入用户名和密码',
    missingToken: '服务器未返回 Token',
    actionFailed: '操作失败，请重试',
    loginFailed: '登录失败，请重试',
    registerFailed: '注册失败，请重试',
    invalidCredentials: '用户名或密码错误',
    usernameAlreadyExists: '用户名已存在',
    noAccount: '没有账号？点击注册',
    hasAccount: '已有账号？点击登录',
    gameDetail: '游戏详情',
    invalidGameId: '无效的游戏 ID',
    loadingGameDetail: '正在加载游戏详情...',
    gameNotFound: '没有找到这款游戏',
    gameUnavailable: '当前游戏详情不可用。',
    retry: '重试',
    category: '分类',
    region: '地区',
    releaseDate: '发布日期',
    overallRating: '综合评分',
    downloadNow: '前往下载',
    watchTrailer: '观看预告',
    backToList: '返回列表',
    guestDetailTip: '游客模式下也会记录最近查看；登录后还可以同步收藏和浏览记录。',
    gameIntroduction: '游戏简介',
    quickFacts: '快速信息',
    trailerAvailable: '已提供链接',
    trailerUnavailable: '暂未提供',
    downloadAvailable: '已提供链接',
    downloadUnavailable: '暂未提供',
    profilePageTitle: '个人设置',
    profilePageSubtitle: '在这里查看账号状态、语言偏好，以及你的收藏和最近查看概况。',
    sessionStatusLabel: '当前会话',
    sessionStatusActive: '已登录',
    profileOverviewTitle: '账号概览',
    profileOverviewDesc: '当前账号的基础信息会显示在这里。',
    usernameLabel: '用户名',
    languageCurrent: '当前语言',
    tokenStatusLabel: '登录状态',
    tokenStatusHealthy: '会话有效',
    languagePreferenceTitle: '语言偏好',
    languagePreferenceDesc: '切换界面语言后，游戏内容和页面文案会一起同步。',
    profileActivityTitle: '个人数据',
    profileActivityDesc: '快速查看你当前账号下最常用的内容统计。',
    profileFavoriteCount: '收藏游戏',
    profileRecentCount: '最近查看',
    profileTopCategory: '偏好分类',
    profileQuickActionsTitle: '快捷操作',
    profileQuickActionsDesc: '从这里可以快速回到你最常用的页面。',
  },
  'en-US': {
    appName: 'G-Guide',
    localeZh: '中文',
    localeEn: 'English',
    processing: 'Processing...',
    favorite: 'Favorite',
    favorited: 'Favorited',
    uncategorized: 'Uncategorized',
    comingSoon: 'Coming soon',
    noRating: 'No rating yet',
    home: 'Home',
    recentlyViewed: 'Recently Viewed',
    favorites: 'Favorites',
    gameHub: 'Game Hub',
    gameHubTitle: 'Browse your library by category',
    gameHubSubtitle:
      'Filtering runs on stable category codes, while labels switch with the current language.',
    searchGameHub: 'Search the game hub',
    allCategories: 'All Categories',
    hubStatGames: 'Total Games',
    hubStatCategories: 'Categories',
    hubStatHighRated: 'Top Picks',
    hubTopRatedTitle: 'Top Rated Here',
    hubLatestTitle: 'Latest Releases',
    hubBrowseTitle: 'Browse by Category',
    hubBrowseSubtitle: 'Filter by category code and show labels in the current language.',
    hubNoMatchesTitle: 'No games matched this category',
    hubNoMatchesDesc: 'Try another category or change your keyword to keep exploring.',
    aiAssistantPending: 'AI Assistant (Coming Soon)',
    searchRecommendedGames: 'Search recommended games',
    searchRecentGames: 'Search recently viewed games',
    searchFavoriteGames: 'Search favorite games',
    guestMode: 'Guest Mode',
    loginOrRegister: 'Login / Register',
    profileSettings: 'Profile Settings',
    logout: 'Log Out',
    welcomeBack: 'Welcome back. Pick what to play tonight.',
    guestWelcomeTitle: 'Explore first, log in when you want to.',
    loggedInIntro: 'Today’s picks, favorites, and recent views are ready for you. Keep scrolling for your next great find.',
    guestIntro: 'You can browse as a guest right now, then log in later to sync favorites and history.',
    guestBannerTitle: 'You are browsing as a guest',
    guestBannerDesc: 'Browse lists and details first, then log in to sync favorites and recent activity.',
    goLogin: 'Go to login',
    syncRecentViews: 'Sync recent views',
    todayPicks: 'Today Picks',
    forYou: 'For You',
    highScoreFirst: 'Top Rated',
    todayRecommendationTitle: 'Today Picks',
    todayRecommendationSubtitle: 'Take a quick look at the games most worth opening today, then decide which details to dive into.',
    selectedPick: 'Curated Pick',
    viewDetails: 'View details',
    clickCardForDetails: 'Click the card to open the full detail page',
    noDescription: 'This game does not have a description yet.',
    forYouTitle: 'Recommended For You',
    forYouFavoriteSubtitle: 'Using your favorites first, then finding more games from similar categories.',
    forYouRecentSubtitle: 'Extending from what you looked at recently, so it is easy to keep exploring your current interests.',
    forYouTopSubtitle: 'No preference data yet, so we are starting with the highest-rated games.',
    preparingRecommendations: 'Preparing your recommendations...',
    noRecommendationMatchesTitle: 'No matching recommendations found',
    noRecommendationMatchesDesc: 'Try another keyword, or open a few game detail pages so the recommendations can learn your taste faster.',
    myLibrary: 'My Library',
    loadingContent: 'Loading content...',
    emptyStateTitle: 'Nothing here yet',
    backHome: 'Back to home',
    continueBrowsing: 'Keep browsing',
    recentlyViewedSubtitle: 'Games whose detail pages you opened recently will appear here so you can jump back in anytime.',
    recentlyViewedEmptyTitle: 'You have not viewed any games recently',
    recentlyViewedEmptyDesc: 'Open any game detail page and your browsing trail will start appearing here.',
    favoritesSubtitle: 'Save games you want to revisit here, then manage them from either the home page or the detail page.',
    favoritesEmptyTitle: 'You have no favorite games yet',
    favoritesEmptyDesc: 'Tap Favorite on the home page and this list will slowly become your personal game shelf.',
    favoritesNoMatchTitle: 'No matching favorites found',
    favoritesNoMatchDesc: 'Try a different keyword, or head back home to keep saving games you like.',
    loginToSyncFavoritesTitle: 'Log in to sync favorites',
    loginToSyncFavoritesDesc: 'You can browse games now. Log in later to save the ones you like into your personal collection.',
    loginToSyncHistoryTitle: 'Log in to sync your data',
    loginToSyncHistoryDesc: 'After login, you can sync this content across different devices.',
    discoverYourWorld: 'Discover the game world that fits you',
    landingDescription: 'G-Guide is a navigation platform built for game lovers. Explore games by category, manage your library, and discover more great content.',
    loginTitle: 'Welcome back',
    registerTitle: 'Create your account',
    usernamePlaceholder: 'Username (test account: admin)',
    passwordPlaceholder: 'Password (test password: admin123)',
    login: 'Login',
    register: 'Register',
    registerSuccess: 'Registration successful. Please log in.',
    missingUsernameOrPassword: 'Please enter both username and password',
    missingToken: 'The server did not return a token',
    actionFailed: 'Action failed. Please try again.',
    loginFailed: 'Login failed. Please try again.',
    registerFailed: 'Registration failed. Please try again.',
    invalidCredentials: 'Incorrect username or password.',
    usernameAlreadyExists: 'This username already exists.',
    noAccount: "Don't have an account? Register",
    hasAccount: 'Already have an account? Log in',
    gameDetail: 'Game Detail',
    invalidGameId: 'Invalid game ID',
    loadingGameDetail: 'Loading game detail...',
    gameNotFound: 'Game not found',
    gameUnavailable: 'This game detail is unavailable right now.',
    retry: 'Retry',
    category: 'Category',
    region: 'Region',
    releaseDate: 'Release Date',
    overallRating: 'Overall Rating',
    downloadNow: 'Open Store',
    watchTrailer: 'Watch Trailer',
    backToList: 'Back to list',
    guestDetailTip: 'Recent views are still tracked in guest mode. Log in to sync favorites and browsing history.',
    gameIntroduction: 'Overview',
    quickFacts: 'Quick Facts',
    trailerAvailable: 'Link available',
    trailerUnavailable: 'Not available',
    downloadAvailable: 'Link available',
    downloadUnavailable: 'Not available',
    profilePageTitle: 'Profile Settings',
    profilePageSubtitle:
      'Review your account status, language preference, and a quick summary of favorites and recent activity.',
    sessionStatusLabel: 'Session',
    sessionStatusActive: 'Signed in',
    profileOverviewTitle: 'Account Overview',
    profileOverviewDesc: 'Your basic account details are shown here.',
    usernameLabel: 'Username',
    languageCurrent: 'Current language',
    tokenStatusLabel: 'Session state',
    tokenStatusHealthy: 'Session active',
    languagePreferenceTitle: 'Language Preference',
    languagePreferenceDesc:
      'When you switch the interface language, both game content and page copy update together.',
    profileActivityTitle: 'Activity Snapshot',
    profileActivityDesc: 'A quick summary of the content you use most on this account.',
    profileFavoriteCount: 'Favorite games',
    profileRecentCount: 'Recently viewed',
    profileTopCategory: 'Top category',
    profileQuickActionsTitle: 'Quick Actions',
    profileQuickActionsDesc: 'Jump back to the places you use most often.',
  },
};
