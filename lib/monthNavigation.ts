
export interface MonthNavigationItem {
  month: number;
  title: string;
  description: string;
  icon: string | React.ComponentType<{ sx?: any }>;
  iconBgColor: string;
}

export const monthNavigation: readonly MonthNavigationItem[] = [
  {
    month: 5,
    title: "Month 5",
    description: "our pterodactyl",
    icon: "raven",
    iconBgColor: "#c8b4e370",
  },
  {
    month: 4,
    title: "Month 4",
    description: "Our daughter",
    icon: "child_care",
    iconBgColor: "#f7c5d570",
  },
  {
    month: 3,
    title: "Month 3",
    description: "New Friends",
    icon: "person_add",
    iconBgColor: "#aec6cf69",
  },
  {
    month: 2,
    title: "Month 2",
    description: "Pobre Lena",
    icon: "explore",
    iconBgColor: "#aec6cf69",
  },
  {
    month: 1,
    title: "Month 1",
    description: "Coming home",
    icon: "home",
    iconBgColor: "#b2d8b266",
  },
  {
    month: 0,
    title: "Month 0",
    description: "How you got here",
    icon: "auto_stories",
    iconBgColor: "#e6bccd70",
  },
] as const;
