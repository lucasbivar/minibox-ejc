import { createTheme, type MantineColorsTuple } from "@mantine/core";

const brand: MantineColorsTuple = [
  "#e9f6ef",
  "#d3ecdf",
  "#a6d9bf",
  "#78c69e",
  "#52b583",
  "#3aa96f",
  "#2f6f4f",
  "#255a3f",
  "#1c4530",
  "#123023",
];

export const theme = createTheme({
  primaryColor: "brand",
  colors: { brand },
  primaryShade: 6,
  defaultRadius: "md",
  fontFamily: "Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  headings: { fontFamily: "Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
});
