import { extendTheme, ThemeConfig } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

const colors = {
  brand: {
    bg: "#22272e",
  },
};

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  styles: {
    global: (props: any) => ({
      body: {
        bg: mode(colors.brand.bg, colors.brand.bg)(props),
      },
    }),
  },
  colors,
  config,
});

export default theme;
