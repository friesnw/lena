import {
  Home as HomeIcon,
  Explore,
} from "@mui/icons-material";

export interface MonthNavigationItem {
  month: number;
  title: string;
  description: string;
  icon: string | React.ComponentType<{ sx?: any }>;
  iconBgColor: string;
}

export const monthNavigation: readonly MonthNavigationItem[] = [
  {
    month: 0,
    title: "Month 0",
    description: "Welcome to the world",
    icon: "auto_stories",
    iconBgColor: "#e6bccd70",
  },
  {
    month: 1,
    title: "Month 1",
    description: "First smiles and giggles",
    icon: HomeIcon,
    iconBgColor: "#b2d8b266",
  },
  {
    month: 2,
    title: "Month 2",
    description: "Little adventures begin",
    icon: "explore",
    iconBgColor: "#aec6cf69",
  },
] as const;

