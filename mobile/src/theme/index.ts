export const COLORS = {
  // Brand Colors
  primary: '#4F46E5',    // Indigo-600 (Core trust & action color)
  primaryLight: '#818CF8', // Indigo-400
  primaryDark: '#3730A3',  // Indigo-800
  
  // Emergency / SOS
  emergency: '#EF4444',    // Red-500 (SOS alert triggers)
  emergencyLight: '#FCA5A5',
  emergencyDark: '#B91C1C',
  
  // System Status
  success: '#10B981',      // Emerald-500
  warning: '#F59E0B',      // Amber-500
  info: '#06B6D4',         // Cyan-500
  
  // Neutral Colors (Dark Mode Aesthetic)
  background: '#0B0F19',   // Deep dark blue-gray
  cardBackground: '#111827', // Dark gray card backing
  border: '#1F2937',       // Slate-800
  
  // Text Colors
  textPrimary: '#F9FAFB',  // Off-white
  textSecondary: '#9CA3AF', // Cool gray
  textMuted: '#6B7280',     // Medium gray
  textDark: '#111827',      // Near black
  
  // White overlay
  white: '#FFFFFF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    h1: 32,
  },
  fontWeights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  shadows: SHADOWS,
};

export default THEME;
