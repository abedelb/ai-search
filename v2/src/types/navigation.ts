export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  description?: string;
  badge?: string;
  href?: string;
  children?: NavigationItem[];
}

export interface Breadcrumb {
  label: string;
  href?: string;
  isActive?: boolean;
}

export type NavigationContext = {
  activeTab: string;
  breadcrumbs: Breadcrumb[];
  setActiveTab: (tab: string) => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
};
