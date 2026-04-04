import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, ChevronDown, Search, Mic, User, Bookmark, ShoppingBag, IceCream, Apple, Smartphone, Pizza, Beef, ChefHat, Soup, Coffee } from 'lucide-react';
import { Switch } from "@food/components/ui/switch";
import foodPattern from "@food/assets/food_pattern_background.png";

const burgerIcon = "https://cdn-icons-png.flaticon.com/512/3075/3075977.png";
const basketIcon = "https://cdn-icons-png.flaticon.com/512/3724/3724720.png";
const dineoutIcon = "https://cdn-icons-png.flaticon.com/512/2515/2515183.png";
const scenesIcon = "https://cdn-icons-png.flaticon.com/512/3163/3163478.png";

const tabs = [
  { id: 'food', name: 'Food', icon: burgerIcon },
  { id: 'quick', name: 'Instamart', icon: basketIcon, badge: '15 mins' },
  { id: 'taxi', name: 'Dineout', icon: dineoutIcon },
  { id: 'hotel', name: 'Scenes', icon: scenesIcon },
];

const normalizeHex = (hex, fallback = '#8e24aa') => {
  const value = String(hex || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const short = value.slice(1);
    return `#${short.split('').map((char) => `${char}${char}`).join('')}`;
  }
  return fallback;
};

const shiftHex = (hex, amount = 0) => {
  const normalized = normalizeHex(hex).replace('#', '');
  const clamp = (num) => Math.max(0, Math.min(255, num));
  const toHex = (num) => clamp(num).toString(16).padStart(2, '0');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `#${toHex(r + amount)}${toHex(g + amount)}${toHex(b + amount)}`;
};

const withAlpha = (hex, alpha = 1) => {
  const normalized = normalizeHex(hex).replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const buildQuickTheme = (baseColor) => {
  const base = normalizeHex(baseColor, '#8e24aa');
  const dark = shiftHex(base, -68);
  const darker = shiftHex(base, -94);
  const light = shiftHex(base, 20);
  const softer = shiftHex(base, 36);
  const deepShadow = withAlpha(dark, 0.44);
  const softShadow = withAlpha(base, 0.20);

  return {
    topBg: `linear-gradient(140deg, ${darker} 0%, ${dark} 48%, ${base} 100%)`,
    tabActiveBg: '#ffffff',
    tabInactiveBg: `linear-gradient(155deg, ${withAlpha(light, 0.30)} 0%, ${withAlpha(base, 0.24)} 100%)`,
    tabActiveBorder: withAlpha('#ffffff', 0.86),
    tabInactiveBorder: withAlpha('#ffffff', 0.18),
    accent: base,
    searchMic: base,
    textColor: '#ffffff',
    subTextColor: 'rgba(255,255,255,0.78)',
    activeCardBg: '#ffffff',
    activeCardBorderTop: `2px solid ${withAlpha('#ffffff', 0.9)}`,
    activeCardBorderLeft: `1.5px solid ${withAlpha('#ffffff', 0.62)}`,
    activeCardBorderRight: `1.5px solid ${withAlpha('#ffffff', 0.62)}`,
    activeCardShadow: `0 -4px 18px ${softShadow}, 0 10px 24px ${deepShadow}`,
    tabLabelActive: shiftHex(base, -36),
    tabLabelInactive: '#ffffff',
    tabInactiveShadow: `inset 0 1px 0 ${withAlpha('#ffffff', 0.20)}, 0 4px 12px ${withAlpha('#000000', 0.18)}`,
    quickActionIcon: base,
    stripeFrom: light,
    stripeTo: base,
    placeholder: 'rgba(40,44,63,0.46)',
    divider: withAlpha(base, 0.20),
    actionBg: `linear-gradient(135deg, ${withAlpha(base, 0.12)}, ${withAlpha(softer, 0.12)})`,
    actionBorder: `1px solid ${withAlpha(base, 0.16)}`,
  };
};

const themes = {
  food: {
    themeType: 'dark', // Switch to dark for better contrast over background video
    topBg: 'transparent',
    tabActiveBg: 'rgba(255, 242, 230, 0.85)',
    tabInactiveBg: 'rgba(255, 255, 255, 0.12)',
    tabActiveBorder: 'rgba(246, 136, 31, 0.45)',
    tabInactiveBorder: 'rgba(255,255,255,0.08)',
    accent: '#F6881F',
    searchMic: '#F6881F',
    textColor: '#ffffff',
    subTextColor: 'rgba(255,255,255,0.85)',
    activeCardBg: '#ffffff',
    activeCardBorderTop: '2px solid rgba(246,136,31,0.35)',
    activeCardBorderLeft: '1.5px solid rgba(246,136,31,0.18)',
    activeCardBorderRight: '1.5px solid rgba(246,136,31,0.18)',
    activeCardShadow: '0 -4px 20px rgba(246,136,31,0.20), 0 10px 24px rgba(0,0,0,0.18)',
  },
  quick: {
    ...buildQuickTheme('#8e24aa'),
    subCats: [
      { name: "All", icon: ShoppingBag },
      { name: "Fresh", icon: Apple },
      { name: "Summer", icon: IceCream },
      { name: "Electronics", icon: Smartphone },
    ],
  },
};

export default function HomeHeader({
  activeTab,
  setActiveTab,
  location,
  handleLocationClick,
  handleSearchFocus,
  placeholderIndex,
  placeholders,
  vegMode,
  onVegModeChange,
  bannerContent,
  quickThemeColor,
}) {
  const quickTheme = buildQuickTheme(quickThemeColor);
  const currentTheme =
    activeTab === 'quick'
      ? quickTheme
      : themes[activeTab] || themes.food;
  const locationTitle = location?.area || 'Pipliyahana';
  const locationSubtitle = location?.address || 'Rajshri Palace Colony, Pipliyahana, Indore';
  const isFoodTheme = activeTab === 'food';
  const searchBarStyle = isFoodTheme
    ? {
        background: '#ffffff',
        border: '1px solid rgba(246,136,31,0.18)',
        boxShadow: '0 6px 18px rgba(15,23,42,0.10)',
        glowShadow: '0 8px 22px rgba(15,23,42,0.12)',
        stripe: 'linear-gradient(180deg, #F6881F, #FF5E3A)',
        placeholder: '#9ca3af',
        divider: 'rgba(246,136,31,0.18)',
        actionBg: 'rgba(246,136,31,0.10)',
        actionBorder: 'none',
        actionIcon: currentTheme.searchMic,
        quickActionBg: 'rgba(255,255,255,0.15)',
        quickActionBorder: '1px solid rgba(255,255,255,0.25)',
        quickActionIcon: '#ffffff',
      }
    : {
        background: currentTheme.activeCardBg,
        borderTop: currentTheme.activeCardBorderTop,
        borderLeft: currentTheme.activeCardBorderLeft,
        borderRight: currentTheme.activeCardBorderRight,
        borderBottom: '1.5px solid rgba(255,255,255,0.30)',
        boxShadow: currentTheme.activeCardShadow,
        glowShadow: currentTheme.activeCardShadow,
        stripe: `linear-gradient(180deg, ${currentTheme.stripeFrom || currentTheme.accent}, ${currentTheme.stripeTo || currentTheme.searchMic})`,
        placeholder: currentTheme.placeholder || 'rgba(40,44,63,0.42)',
        divider: currentTheme.divider || 'rgba(142,36,170,0.18)',
        actionBg: currentTheme.actionBg || 'linear-gradient(135deg, rgba(217,70,239,0.10), rgba(142,36,170,0.08))',
        actionBorder: currentTheme.actionBorder || '1px solid rgba(217,70,239,0.14)',
        actionIcon: currentTheme.searchMic,
        quickActionBg: currentTheme.activeCardBg,
        quickActionBorderTop: currentTheme.activeCardBorderTop,
        quickActionBorderLeft: currentTheme.activeCardBorderLeft,
        quickActionBorderRight: currentTheme.activeCardBorderRight,
        quickActionBorderBottom: '1.5px solid rgba(255,255,255,0.30)',
        quickActionIcon: currentTheme.searchMic,
      };

  return (
    <motion.div
      id="home-header-main"
      className={`relative overflow-hidden transition-all duration-700 ${
        activeTab === 'food' ? 'min-h-[450px]' : 'min-h-[90px]'
      }`}
      style={{
        background: activeTab === 'food' ? 'transparent' : currentTheme.topBg,
        color: currentTheme.textColor || '#ffffff',
      }}
    >
      {/* Background Banner Content (Video/Images) */}
      {activeTab === 'food' && bannerContent && (
        <div className="absolute inset-0 z-0 flex justify-center overflow-hidden bg-transparent">
          {bannerContent}
          {/* Gradients for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#7f2d25]/88 via-[#7f2d25]/18 via-[28%] to-black/22 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-black/16 pointer-events-none" />
        </div>
      )}

      <div className="absolute inset-0 food-bg-pattern pointer-events-none opacity-[0.1] z-[1]" />

      {activeTab === 'food' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Pizza className="absolute top-10 right-[15%] opacity-[0.10] text-[#F6881F] animate-float-slow" size={64} style={{ animationDelay: '0s' }} />
          <Beef className="absolute top-40 left-[10%] opacity-[0.08] text-[#F6881F] animate-float-slow" size={80} style={{ animationDelay: '2s' }} />
          <ChefHat className="absolute bottom-[20%] right-[20%] opacity-[0.08] text-[#F6881F] animate-float-slow" size={56} style={{ animationDelay: '4s' }} />
          <Coffee className="absolute top-20 left-[30%] opacity-[0.08] text-[#F6881F] animate-float-slow" size={48} style={{ animationDelay: '1s' }} />
          <Soup className="absolute bottom-[40%] left-[5%] opacity-[0.05] text-[#F6881F] animate-float-slow" size={72} style={{ animationDelay: '3s' }} />
        </div>
      )}

      <style>{`
        .inverted-corner-left::before {
          content: '';
          position: absolute;
          bottom: 0px;
          left: -20px;
          width: 20px;
          height: 20px;
          background: transparent;
          border-bottom-right-radius: 20px;
          box-shadow: 10px 0 0 0 #ffffff;
          z-index: 10;
        }
        .inverted-corner-right::after {
          content: '';
          position: absolute;
          bottom: 0px;
          right: -20px;
          width: 20px;
          height: 20px;
          background: transparent;
          border-bottom-left-radius: 20px;
          box-shadow: -10px 0 0 0 #ffffff;
          z-index: 10;
        }
        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-floating {
          animation: floating 3.5s ease-in-out infinite;
        }
        @keyframes move-bg {
          from { background-position: 0 0; }
          to { background-position: 400px 400px; }
        }
        .food-bg-pattern {
          background-image: url(${foodPattern});
          background-size: 200px;
          background-repeat: repeat;
          z-index: 0;
          animation: move-bg 60s linear infinite;
          mix-blend-mode: soft-light;
          filter: brightness(1.2);
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(15px, -15px) rotate(5deg); }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        @keyframes search-glow {
          0%, 100% { box-shadow: var(--search-shadow), 0 0 0 rgba(0,0,0,0); }
          50% { box-shadow: var(--search-shadow-active), 0 0 0 rgba(0,0,0,0); }
        }
        .search-bar-glow {
          animation: search-glow 3s ease-in-out infinite;
        }
        .tab-inactive-card {
          background: linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,180,120,0.18) 100%);
          border-top: 1.5px solid rgba(255,255,255,0.40);
          border-left: 1.5px solid rgba(255,255,255,0.28);
          border-right: 1.5px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
      `}</style>

      <div className="flex items-center justify-between px-5 pt-6 mb-3 relative z-10">
        <div className="flex items-start gap-2 cursor-pointer flex-1 min-w-0" onClick={handleLocationClick}>
          {activeTab === 'food' ? (
            <>
              <Navigation className="h-[14px] w-[14px] rotate-[15deg] mt-[5px] shrink-0" style={{ color: currentTheme.accent, fill: currentTheme.accent }} strokeWidth={2.5} />
              <div className="flex min-w-0 max-w-[190px] flex-col">
                <div className="flex items-center gap-[3px]">
                  <span
                    className="truncate"
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      letterSpacing: '-0.3px',
                      lineHeight: 1,
                      color: currentTheme.textColor || '#ffffff',
                      fontFamily: "'Inter', 'Outfit', sans-serif",
                    }}
                  >
                    {locationTitle}
                  </span>
                  <ChevronDown className="h-[14px] w-[14px] shrink-0 opacity-80" strokeWidth={3} />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: currentTheme.subTextColor || 'rgba(255,255,255,0.68)',
                    marginTop: '4px',
                    lineHeight: 1.15,
                    fontFamily: "'Inter', 'Outfit', sans-serif",
                  }}
                  className="max-w-[190px] truncate"
                >
                  {locationSubtitle}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col min-w-0">
              <span className="text-[22px] font-black tracking-tighter leading-none mb-1">15 mins</span>
              <div className="flex items-center gap-1 opacity-70">
                <span className="text-[11px] font-bold truncate">To Pipliyahana</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'food' && (
            <div className="bg-white rounded-full flex items-center py-1.5 pl-1.5 pr-3 shadow-lg active:scale-95 transition-all border border-gray-100">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mr-1.5 shadow-inner">
                <span className="text-white text-[8px] font-black leading-none">BUY</span>
              </div>
              <span className="text-[12px] font-black text-[#F6881F]">one</span>
            </div>
          )}
          <div className="h-[38px] w-[38px] rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <User className="h-[20px] w-[20px] text-[#282c3f]" strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="px-3 pt-1 flex items-end justify-start gap-[6px] relative z-10">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-start flex-1 min-w-0 h-[80px] transition-all duration-300 ${isActive ? 'z-20' : 'z-10'}`}
            >
              {tab.badge && (
                <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 z-30">
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #FF6B35, #F6881F)',
                      color: '#fff',
                      fontSize: '7.5px',
                      fontWeight: 900,
                      padding: '2.5px 8px',
                      borderRadius: '20px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 3px 10px rgba(246,136,31,0.55)',
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tab.badge}
                  </div>
                </div>
              )}

              {/* Active tab â€” bright white card with orange accent */}
              {isActive && (
                <motion.div
                  layoutId="tabCutoutShape"
                  className="absolute inset-x-0 top-0 bottom-0 rounded-t-[18px] rounded-b-none inverted-corner-left inverted-corner-right"
                  style={{
                    backgroundColor: currentTheme.activeCardBg,
                    borderTop: currentTheme.activeCardBorderTop,
                    borderLeft: currentTheme.activeCardBorderLeft,
                    borderRight: currentTheme.activeCardBorderRight,
                    boxShadow: currentTheme.activeCardShadow,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}

              {/* Inactive tab â€” warm glass card with visible contrast */}
              {!isActive && (
                <div
                  className={`absolute inset-x-0 top-[8px] bottom-0 rounded-t-[16px] rounded-b-none ${activeTab === 'food' ? 'tab-inactive-card' : ''}`}
                  style={{
                    background: activeTab === 'food'
                      ? undefined
                      : currentTheme.tabInactiveBg,
                    borderTop: activeTab === 'food'
                      ? undefined
                      : `1.5px solid ${currentTheme.tabInactiveBorder}`,
                    borderLeft: activeTab === 'food'
                      ? undefined
                      : `1.5px solid ${withAlpha('#ffffff', 0.22)}`,
                    borderRight: activeTab === 'food'
                      ? undefined
                      : `1.5px solid ${withAlpha('#ffffff', 0.14)}`,
                    backdropFilter: activeTab === 'food' ? undefined : 'blur(14px)',
                    WebkitBackdropFilter: activeTab === 'food' ? undefined : 'blur(14px)',
                    boxShadow: activeTab === 'food'
                      ? 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 12px rgba(0,0,0,0.15)'
                      : currentTheme.tabInactiveShadow,
                  }}
                />
              )}

              <div className={`absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-center gap-[3px] px-1 ${isActive ? 'top-0' : 'top-[8px]'}`}>
                {tab.id === 'food' && isActive ? (
                  <motion.img
                    src={burgerIcon}
                    alt="Food"
                    className="h-[36px] w-[36px] object-contain drop-shadow-[0_6px_12px_rgba(246,136,31,0.35)] relative z-10"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : (
                  <img
                    src={tab.icon}
                    alt={tab.name}
                    className={`object-contain transition-transform duration-300 ${
                      isActive
                        ? 'h-[32px] w-[32px] scale-105 drop-shadow-lg animate-floating'
                        : 'h-[28px] w-[28px] brightness-[1.4] drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]'
                    }`}
                  />
                )}
                <span
                  style={{
                    fontSize: isActive ? '10.5px' : '10px',
                    fontWeight: isActive ? 800 : 800,
                    color: isActive
                      ? (currentTheme.tabLabelActive || '#C4510A')
                      : (currentTheme.tabLabelInactive || '#ffffff'),
                    letterSpacing: isActive ? '-0.2px' : '0.2px',
                    fontFamily: "'Inter', 'Outfit', sans-serif",
                    textShadow: isActive ? 'none' : '0 1px 6px rgba(0,0,0,0.55)',
                  }}
                >
                  {tab.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="relative z-10 pt-3 pb-3 px-3 -mt-[1px] overflow-hidden"
        style={{ 
          background: activeTab === 'food'
            ? 'transparent'
            : 'transparent',
        }}
      >
        <div className="absolute inset-0 food-bg-pattern opacity-[0.06] pointer-events-none" />
        {activeTab === 'food' && (
           <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
        )}

        <div className="flex items-center gap-2 mb-2">
          {/* Search Bar â€” crisp white with warm glow */}
          <div
            className={`flex-1 rounded-[12px] h-[46px] flex items-center px-3 active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden ${isFoodTheme ? '' : 'search-bar-glow'}`}
            style={{
              background: searchBarStyle.background,
              border: searchBarStyle.border,
              borderTop: searchBarStyle.borderTop,
              borderLeft: searchBarStyle.borderLeft,
              borderRight: searchBarStyle.borderRight,
              borderBottom: searchBarStyle.borderBottom,
              boxShadow: searchBarStyle.boxShadow,
              backdropFilter: isFoodTheme ? undefined : 'blur(14px)',
              WebkitBackdropFilter: isFoodTheme ? undefined : 'blur(14px)',
              '--search-shadow': searchBarStyle.boxShadow,
              '--search-shadow-active': searchBarStyle.glowShadow,
            }}
            onClick={handleSearchFocus}
          >
            {/* orange left accent stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-[2.5px] rounded-l-[12px]" style={{ background: searchBarStyle.stripe }} />
            <Search className="h-[16px] w-[16px] ml-1.5 mr-2 flex-shrink-0" style={{ color: currentTheme.searchMic }} strokeWidth={2.3} />
            <div className="flex-1 overflow-hidden relative h-[20px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={placeholderIndex}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 whitespace-nowrap leading-[22px]"
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 500,
                    color: searchBarStyle.placeholder,
                    fontFamily: "'Inter', 'Outfit', sans-serif",
                  }}
                >
                  {placeholders?.[placeholderIndex] || "Search for food..."}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[1px] h-[16px]" style={{ backgroundColor: searchBarStyle.divider }} />
              <div
                className="h-[28px] w-[28px] rounded-full flex items-center justify-center"
                style={{
                  background: searchBarStyle.actionBg,
                  border: searchBarStyle.actionBorder,
                }}
              >
                <Mic className="h-[14px] w-[14px]" style={{ color: searchBarStyle.actionIcon }} strokeWidth={2.3} />
              </div>
            </div>
          </div>

          {/* VEG Toggle â€” transparent container */}
          {activeTab === 'food' ? (
            <div
              onClick={() => onVegModeChange(!vegMode)}
              className="px-2 flex flex-col items-center justify-center min-w-[64px] cursor-pointer active:scale-95 transition-all"
            >
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 900,
                  color: '#000000',
                  letterSpacing: '0.5px',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                ðŸŒ¿ VEG
              </span>
              <div className="scale-[0.80]">
                <Switch
                  checked={vegMode}
                  onCheckedChange={(val) => { /* handled by parent div onClick */ }}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-400 pointer-events-none"
                />
              </div>
            </div>
          ) : (
            <button
              className="rounded-[16px] h-[52px] w-[52px] flex items-center justify-center shadow-xl backdrop-blur-lg active:scale-95 transition-transform"
              style={{
                background: searchBarStyle.quickActionBg,
                border: searchBarStyle.quickActionBorder,
                borderTop: searchBarStyle.quickActionBorderTop,
                borderLeft: searchBarStyle.quickActionBorderLeft,
                borderRight: searchBarStyle.quickActionBorderRight,
                borderBottom: searchBarStyle.quickActionBorderBottom,
              }}
            >
              <Bookmark className="h-[22px] w-[22px]" style={{ color: currentTheme.quickActionIcon || searchBarStyle.quickActionIcon }} />
            </button>
          )}
        </div>

      </div>
    </motion.div>
  );
}

