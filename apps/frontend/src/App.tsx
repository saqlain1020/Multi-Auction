import "./App.css";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Routes, Route, RouterProvider } from "react-router-dom";

import theme from "./config/theme";
import ResponsiveDrawer from "./components/Drawer/Drawer";
import routes from "./config/routes";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ResponsiveDrawer />
    </ThemeProvider>
  );
}

export default App;

