import React from 'react';

type IconProps = { size?: number; className?: string };
const base = (size = 16) => ({ width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

// Mode icons
export const PixelIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="1" y="1" width="5" height="5" /><rect x="10" y="1" width="5" height="5" />
    <rect x="1" y="10" width="5" height="5" /><rect x="10" y="10" width="5" height="5" />
    <rect x="5.5" y="5.5" width="5" height="5" />
  </svg>
);

export const BusinessIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="1" y="4" width="14" height="10" rx="1" />
    <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    <line x1="1" y1="9" x2="15" y2="9" />
  </svg>
);

export const VectorIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M2 13 C4 8, 8 3, 14 3" />
    <circle cx="2" cy="13" r="1.5" fill="currentColor" />
    <circle cx="14" cy="3" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1" />
  </svg>
);

export const VoiceIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <line x1="2" y1="8" x2="2" y2="8" /><line x1="4" y1="5" x2="4" y2="11" />
    <line x1="6" y1="3" x2="6" y2="13" /><line x1="8" y1="5" x2="8" y2="11" />
    <line x1="10" y1="6" x2="10" y2="10" /><line x1="12" y1="4" x2="12" y2="12" />
    <line x1="14" y1="6" x2="14" y2="10" />
  </svg>
);

export const TextIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <line x1="2" y1="4" x2="14" y2="4" /><line x1="2" y1="7" x2="14" y2="7" />
    <line x1="2" y1="10" x2="10" y2="10" /><line x1="2" y1="13" x2="8" y2="13" />
  </svg>
);

export const UIUXIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="1" y="2" width="14" height="12" rx="1" />
    <line x1="1" y1="5" x2="15" y2="5" />
    <rect x="3" y="7" width="4" height="3" rx="0.5" />
    <line x1="9" y1="8" x2="13" y2="8" /><line x1="9" y1="10" x2="11" y2="10" />
  </svg>
);

// Action icons
export const GenerateIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <polygon points="8,1 15,8 8,15 1,8" />
    <line x1="8" y1="4" x2="8" y2="12" /><line x1="4" y1="8" x2="12" y2="8" />
  </svg>
);

export const DownloadIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <line x1="8" y1="2" x2="8" y2="11" />
    <polyline points="4,8 8,12 12,8" />
    <line x1="2" y1="14" x2="14" y2="14" />
  </svg>
);

export const CopyIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="5" y="5" width="9" height="10" rx="1" />
    <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2" />
  </svg>
);

export const SaveIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M13 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h8l3 3v9a1 1 0 0 1-1 1z" />
    <line x1="5" y1="14" x2="5" y2="9" /><line x1="11" y1="14" x2="11" y2="9" />
    <line x1="5" y1="9" x2="11" y2="9" />
    <rect x="5" y="2" width="5" height="3" />
  </svg>
);

export const ShareIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="3" r="1.5" /><circle cx="12" cy="13" r="1.5" />
    <circle cx="4" cy="8" r="1.5" />
    <line x1="10.5" y1="3.8" x2="5.5" y2="7.2" />
    <line x1="10.5" y1="12.2" x2="5.5" y2="8.8" />
  </svg>
);

export const RefreshIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M14 8a6 6 0 1 1-1.5-4" />
    <polyline points="14,2 14,6 10,6" />
  </svg>
);

export const EralIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="8" cy="8" r="2" /><circle cx="3" cy="3" r="1.5" />
    <circle cx="13" cy="3" r="1.5" /><circle cx="3" cy="13" r="1.5" />
    <circle cx="13" cy="13" r="1.5" />
    <line x1="4.1" y1="4.1" x2="6.4" y2="6.4" />
    <line x1="11.9" y1="4.1" x2="9.6" y2="6.4" />
    <line x1="4.1" y1="11.9" x2="6.4" y2="9.6" />
    <line x1="11.9" y1="11.9" x2="9.6" y2="9.6" />
  </svg>
);

export const SettingsIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" />
  </svg>
);

export const GalleryIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="1" y="1" width="14" height="14" rx="1" />
    <circle cx="5" cy="5" r="1.5" />
    <polyline points="1,11 5,7 8,10 11,7 15,11" />
  </svg>
);

export const ProjectsIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M1 5a1 1 0 0 1 1-1h5l2 2h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5z" />
  </svg>
);

export const LogoIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <polygon points="8,1 14,13 2,13" />
    <line x1="8" y1="6" x2="8" y2="10" />
    <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
  </svg>
);

export const SlideIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="1" y="2" width="14" height="10" rx="1" />
    <line x1="5" y1="14" x2="11" y2="14" />
    <line x1="8" y1="12" x2="8" y2="14" />
  </svg>
);

export const SocialIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="1" y="1" width="14" height="14" rx="2" />
    <circle cx="8" cy="7" r="2.5" />
    <path d="M2 14 C2 11, 5 9.5, 8 9.5 C11 9.5, 14 11, 14 14" />
  </svg>
);

export const HeroIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="1" y="1" width="14" height="14" rx="1" />
    <line x1="4" y1="6" x2="12" y2="6" />
    <line x1="5" y1="9" x2="11" y2="9" />
    <line x1="6" y1="12" x2="10" y2="12" />
  </svg>
);

export const MicIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="5" y="1" width="6" height="9" rx="3" />
    <path d="M2 8a6 6 0 0 0 12 0" />
    <line x1="8" y1="14" x2="8" y2="15" />
    <line x1="5" y1="15" x2="11" y2="15" />
  </svg>
);

export const WarningIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M8 1L15 14H1L8 1z" />
    <line x1="8" y1="6" x2="8" y2="10" />
    <circle cx="8" cy="12" r="0.5" fill="currentColor" />
  </svg>
);

export const SearchIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="7" cy="7" r="5" />
    <line x1="11" y1="11" x2="15" y2="15" />
  </svg>
);

export const GlobeIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="8" cy="8" r="7" />
    <path d="M8 1C6 4, 5 6, 5 8s1 4 3 7" />
    <path d="M8 1c2 3, 3 5, 3 7s-1 4-3 7" />
    <line x1="1" y1="8" x2="15" y2="8" />
  </svg>
);

export const LockIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="7" width="10" height="8" rx="1" />
    <path d="M5 7V5a3 3 0 0 1 6 0v2" />
  </svg>
);

export const TrashIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <polyline points="2,4 4,4 14,4" />
    <path d="M13 4l-1 10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1L3 4" />
    <path d="M6 4V2h4v2" />
    <line x1="6" y1="7" x2="6" y2="11" />
    <line x1="10" y1="7" x2="10" y2="11" />
  </svg>
);

export const BellIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M13 10V7A5 5 0 0 0 3 7v3l-1.5 2h13L13 10z" />
    <path d="M6.5 14a1.5 1.5 0 0 0 3 0" />
  </svg>
);

export const LinkIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M10 6a4 4 0 0 1 0 5.66L8.66 13A4 4 0 0 1 3 7.34L4.34 6" />
    <path d="M6 10a4 4 0 0 1 0-5.66L7.34 3A4 4 0 0 1 13 8.66L11.66 10" />
  </svg>
);

export const MailIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="1" y="3" width="14" height="10" rx="1" />
    <polyline points="1,3 8,9 15,3" />
  </svg>
);

export const BoltIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M10 1L4 9h5l-2 6 7-8H9l2-6z" />
  </svg>
);

export const KeyIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="6" cy="7" r="4" />
    <line x1="9.5" y1="10.5" x2="15" y2="15" />
    <line x1="12" y1="13" x2="13" y2="12" />
  </svg>
);

export const CardIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="1" y="3" width="14" height="10" rx="1" />
    <line x1="1" y1="7" x2="15" y2="7" />
    <line x1="4" y1="11" x2="7" y2="11" />
  </svg>
);

export const ImageIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="1" y="1" width="14" height="14" rx="1" />
    <circle cx="5" cy="5" r="1.5" />
    <polyline points="1,11 5,7 8,10 11,7 15,11" />
  </svg>
);

export const MenuIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <line x1="2" y1="4" x2="14" y2="4" />
    <line x1="2" y1="8" x2="14" y2="8" />
    <line x1="2" y1="12" x2="14" y2="12" />
  </svg>
);

export const PhoneIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 2h3l1.5 4-2 1a10 10 0 0 0 3.5 3.5l1-2 4 1.5V13a1 1 0 0 1-1 1C6 14 2 8 2 3a1 1 0 0 1 1-1z" />
  </svg>
);

export const SpeakerIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <polygon points="1,5 5,5 9,2 9,14 5,11 1,11" />
    <path d="M12 5a4 4 0 0 1 0 6" />
    <path d="M14 3a7 7 0 0 1 0 10" />
  </svg>
);
