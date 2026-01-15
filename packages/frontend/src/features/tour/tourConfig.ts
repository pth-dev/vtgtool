/**
 * Tour Configurations
 * Predefined guided tours for VTG Tool
 */

import type { Tour, TourStep } from './types';

// =============================================================================
// TOUR STEP DEFINITIONS
// =============================================================================

const quickStartSteps: TourStep[] = [
  {
    id: 'welcome',
    target: 'sidebar',
    title: 'Welcome to VTG Tool! 🎉',
    content: 'This guided tour will help you understand the key features. Let\'s explore together!',
    position: 'right',
    spotlightPadding: 8,
  },
  {
    id: 'dashboard-nav',
    target: 'nav-dashboard',
    title: 'Dashboard',
    content: 'Your main analytics hub. View KPIs, charts, and insights about Lock/Hold/Failed orders.',
    position: 'right',
    route: '/',
  },
  {
    id: 'kpi-section',
    target: 'kpi-section',
    title: 'KPI Overview',
    content: 'See key metrics at a glance: Total orders, Lock rate, Hold rate, Failed rate, and Resume Success Rate.',
    position: 'bottom',
    route: '/',
    spotlightPadding: 12,
  },
  {
    id: 'charts-section',
    target: 'charts-grid',
    title: 'Interactive Charts',
    content: 'Click on any chart to drill down into details. Drag to rearrange, resize as needed.',
    position: 'top',
    spotlightPadding: 12,
  },
  {
    id: 'ai-chat',
    target: 'chat-button',
    title: 'AI Assistant',
    content: 'Click here to open the AI chat. Ask questions about your data or how to use the system!',
    position: 'left',
    spotlightPadding: 4,
  },
  {
    id: 'filter-panel',
    target: 'filter-panel',
    title: 'Filters',
    content: 'Filter data by month, customer, category, and more. All charts update in real-time.',
    position: 'bottom',
    spotlightPadding: 8,
  },
];

const dashboardDeepDiveSteps: TourStep[] = [
  {
    id: 'dd-intro',
    target: 'kpi-section',
    title: 'Dashboard Deep Dive',
    content: 'Let\'s explore the dashboard features in detail. This tour covers all analytics capabilities.',
    position: 'bottom',
    route: '/',
    spotlightPadding: 12,
  },
  {
    id: 'dd-total',
    target: 'kpi-total',
    title: 'Total Orders',
    content: 'Total number of orders with Lock, Hold, or Failed status for the selected period.',
    position: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: 'dd-lock',
    target: 'kpi-lock',
    title: 'Lock Rate',
    content: 'LOCK means production is blocked and cannot proceed. Click to see which orders are locked.',
    position: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: 'dd-hold',
    target: 'kpi-hold',
    title: 'Hold Rate',
    content: 'HOLD means temporarily paused - waiting for customer confirmation or materials.',
    position: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: 'dd-failed',
    target: 'kpi-failed',
    title: 'Failed Rate',
    content: 'FAILED/CANCELED orders that could not be completed.',
    position: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: 'dd-resume',
    target: 'kpi-resume',
    title: 'Resume Success Rate',
    content: 'Percentage of blocked orders that were successfully resumed. Higher is better!',
    position: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: 'dd-customer-chart',
    target: 'chart-by_customer',
    title: 'By Customer',
    content: 'See which customers have the most blocked orders. Click bars to drill down.',
    position: 'right',
    spotlightPadding: 8,
  },
  {
    id: 'dd-category-chart',
    target: 'chart-by_category',
    title: 'By Category',
    content: 'Distribution across product categories. Identify problematic categories.',
    position: 'left',
    spotlightPadding: 8,
  },
  {
    id: 'dd-root-cause',
    target: 'chart-root_cause',
    title: 'Root Cause Analysis',
    content: 'Understand WHY orders are blocked. Essential for process improvement.',
    position: 'top',
    spotlightPadding: 8,
  },
  {
    id: 'dd-trend',
    target: 'chart-trend',
    title: 'Trend Over Time',
    content: 'Track how rates change over months. Spot patterns and measure improvement.',
    position: 'top',
    spotlightPadding: 8,
  },
  {
    id: 'dd-filters',
    target: 'filter-panel',
    title: 'Advanced Filters',
    content: 'Filter by customer, category, status, and more. All charts update in real-time.',
    position: 'bottom',
    spotlightPadding: 8,
  },
];

const dataManagementSteps: TourStep[] = [
  {
    id: 'dm-intro',
    target: 'nav-data-sources',
    title: 'Data Management',
    content: 'Admin feature to upload and manage your data. Let\'s see how it works.',
    position: 'right',
    spotlightPadding: 4,
  },
  {
    id: 'dm-table',
    target: 'data-sources-table',
    title: 'Dataset List',
    content: 'View all uploaded datasets here. You can preview, delete, or check the record count.',
    position: 'top',
    route: '/admin/data-sources',
    spotlightPadding: 8,
  },
  {
    id: 'dm-import',
    target: 'import-data-button',
    title: 'Import Data',
    content: 'Click here to upload new data files (Excel, CSV). The system will validate and process them.',
    position: 'bottom',
    spotlightPadding: 4,
  },
];

const iscTrackingSteps: TourStep[] = [
  {
    id: 'isc-intro',
    target: 'nav-isc-do-tracking',
    title: 'ISC-DO Tracking',
    content: 'Inventory Stock Control - check if requested quantities are valid based on consumption patterns.',
    position: 'right',
    spotlightPadding: 4,
  },
  {
    id: 'isc-form',
    target: 'isc-input-form',
    title: 'Input Form',
    content: 'Enter Item Code, current stock (Pick to Light), and requested quantity to validate.',
    position: 'right',
    route: '/isc-do-tracking',
    spotlightPadding: 8,
  },
  {
    id: 'isc-result',
    target: 'isc-result-panel',
    title: 'Result Panel',
    content: 'See the validation result here. Green = OK to proceed, Red = exceeds threshold.',
    position: 'left',
    spotlightPadding: 8,
  },
];

const aiChatMasterySteps: TourStep[] = [
  {
    id: 'ai-intro',
    target: 'chat-button',
    title: 'AI Chat Mastery',
    content: 'Learn how to get the most out of VTG Assistant. Click to open the chat!',
    position: 'left',
    spotlightPadding: 4,
  },
  {
    id: 'ai-tips',
    target: 'chat-button',
    title: 'Pro Tips',
    content: 'Try asking: What causes most holds, Compare months, or Help me with the dashboard',
    position: 'left',
    spotlightPadding: 4,
    allowInteraction: true,
  },
];

// =============================================================================
// TOUR DEFINITIONS
// =============================================================================

export const TOURS: Tour[] = [
  {
    id: 'quick-start',
    name: 'Quick Start Guide',
    description: 'A 2-minute tour of essential features. Perfect for new users.',
    category: 'getting-started',
    steps: quickStartSteps,
    icon: 'RocketLaunch',
    estimatedTime: 2,
  },
  {
    id: 'dashboard-deep-dive',
    name: 'Dashboard Deep Dive',
    description: 'Master all dashboard features: KPIs, charts, filters, and drill-downs.',
    category: 'dashboard',
    steps: dashboardDeepDiveSteps,
    icon: 'Dashboard',
    estimatedTime: 5,
    prerequisites: ['quick-start'],
  },
  {
    id: 'data-management',
    name: 'Data Management',
    description: 'Learn to upload and manage your data sources. Admin access required.',
    category: 'data-management',
    steps: dataManagementSteps,
    icon: 'Storage',
    estimatedTime: 3,
    prerequisites: ['quick-start'],
  },
  {
    id: 'isc-tracking',
    name: 'ISC-DO Tracking',
    description: 'Understand inventory validation and delivery order checks.',
    category: 'isc-tracking',
    steps: iscTrackingSteps,
    icon: 'Inventory',
    estimatedTime: 3,
  },
  {
    id: 'ai-chat-mastery',
    name: 'AI Chat Mastery',
    description: 'Get the most out of your AI assistant with tips and tricks.',
    category: 'ai-chat',
    steps: aiChatMasterySteps,
    icon: 'Psychology',
    estimatedTime: 2,
  },
];

// Helper to get tour by ID
export const getTourById = (id: string): Tour | undefined => {
  return TOURS.find(tour => tour.id === id);
};

// Helper to get tours by category
export const getToursByCategory = (category: string): Tour[] => {
  return TOURS.filter(tour => tour.category === category);
};

// Tour categories with metadata
export const TOUR_CATEGORIES = [
  { id: 'getting-started', name: 'Getting Started', icon: 'PlayArrow' },
  { id: 'dashboard', name: 'Dashboard', icon: 'Dashboard' },
  { id: 'data-management', name: 'Data Management', icon: 'Storage' },
  { id: 'isc-tracking', name: 'ISC Tracking', icon: 'Inventory' },
  { id: 'ai-chat', name: 'AI Chat', icon: 'Psychology' },
];
