// Overview page section types and interfaces

export interface OverviewPageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle?: string;
  description?: string;
  background_color: string;
  text_color: string;
  gradient_from?: string;
  gradient_to?: string;
  is_active: boolean;
  sort_order: number;
  section_type: OverviewSectionType;
  layout_config: Record<string, any>;
  content?: Array<OverviewSectionContent>;
  links?: Array<OverviewSectionLink>;
}

export interface OverviewSectionContent {
  id: string;
  content_type: OverviewContentType;
  content_key: string;
  content_value: string;
  metadata?: Record<string, any>;
  sort_order: number;
}

export interface OverviewSectionLink {
  id: string;
  link_type: OverviewLinkType;
  link_text: string;
  url: string;
  button_variant: ButtonVariant;
  button_size: ButtonSize;
  icon?: string;
  color: string;
  sort_order: number;
}

// Section Types
export type OverviewSectionType = 
  | 'hero'           // Hero section with large title and description
  | 'info_card'      // Information card with gradient header (WTF, CFO Memo)
  | 'tool_time_card' // Special large card for Tool Time
  | 'cta';           // Call-to-action section with buttons

// Content Types
export type OverviewContentType = 
  | 'text'     // Simple text content
  | 'html'     // Rich HTML content
  | 'image'    // Image URLs
  | 'icon'     // Lucide icon names
  | 'list'     // JSON array for badges, bullet points, etc.
  | 'badge';   // Badge content

// Link Types
export type OverviewLinkType = 
  | 'button'      // Action buttons
  | 'navigation'  // Internal navigation links
  | 'external'    // External links
  | 'download';   // Download links

// UI Component Types
export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
export type ButtonSize = 'sm' | 'default' | 'lg';

// Section-specific configurations
export interface HeroSectionConfig {
  text_align: 'left' | 'center' | 'right';
  max_width: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
}

export interface InfoCardSectionConfig {
  card_style: 'default' | 'gradient_header' | 'bordered';
  icon: string; // Lucide icon name
  layout: 'single' | 'grid';
}

export interface ToolTimeCardSectionConfig {
  card_style: 'large_card' | 'default';
  icon: string;
  layout: 'single_column' | 'two_column';
}

export interface CTASectionConfig {
  text_align: 'left' | 'center' | 'right';
  padding: 'default' | 'large' | 'small';
  button_layout: 'horizontal' | 'vertical' | 'responsive';
}

// Helper type for layout configurations
export type OverviewLayoutConfig = 
  | HeroSectionConfig 
  | InfoCardSectionConfig 
  | ToolTimeCardSectionConfig 
  | CTASectionConfig;

// Constants for admin interface
export const OVERVIEW_SECTION_TYPES = [
  { value: 'hero', label: 'Hero Section', description: 'Large title and description section' },
  { value: 'info_card', label: 'Information Card', description: 'Card with gradient header and structured content' },
  { value: 'tool_time_card', label: 'Tool Time Card', description: 'Special large card for Tool Time content' },
  { value: 'cta', label: 'Call-to-Action', description: 'Section with action buttons' }
] as const;

export const OVERVIEW_CONTENT_TYPES = [
  { value: 'text', label: 'Text', description: 'Simple text content' },
  { value: 'html', label: 'HTML', description: 'Rich HTML content' },
  { value: 'image', label: 'Image', description: 'Image URL' },
  { value: 'icon', label: 'Icon', description: 'Lucide icon name' },
  { value: 'list', label: 'List', description: 'JSON array for lists and badges' },
  { value: 'badge', label: 'Badge', description: 'Badge content' }
] as const;

export const OVERVIEW_LINK_TYPES = [
  { value: 'button', label: 'Button', description: 'Action button' },
  { value: 'navigation', label: 'Navigation', description: 'Internal navigation link' },
  { value: 'external', label: 'External', description: 'External website link' },
  { value: 'download', label: 'Download', description: 'File download link' }
] as const;

export const BUTTON_VARIANTS = [
  { value: 'default', label: 'Default' },
  { value: 'outline', label: 'Outline' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'destructive', label: 'Destructive' },
  { value: 'secondary', label: 'Secondary' }
] as const;

export const BUTTON_SIZES = [
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' }
] as const;