import "@mui/material";

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    primary: true;
    secondary: true;
    link: true;
  }
}

declare module "@mui/material/styles" {
  interface Palette {
    neutral?: {
      50: string;
      100: string;
      200: string;
      400: string;
      700: string;
      900: string;
    };
    accent?: {
      darkGreen: string;
      lightGreen: string;
      blush: string;
      blushLight: string;
      blueLight: string;
      greenLight: string;
    };
  }

  interface PaletteOptions {
    neutral?: {
      50: string;
      100: string;
      200: string;
      400: string;
      700: string;
      900: string;
    };
    accent?: {
      darkGreen: string;
      lightGreen: string;
      blush: string;
      blushLight: string;
      blueLight: string;
      greenLight: string;
    };
  }

  interface TypeBackground {
    card?: string; // Your custom background property
    surface?: string; // Another custom background property
  }
}
