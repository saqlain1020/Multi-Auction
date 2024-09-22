import "./App.css";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import theme from "./config/theme";
import ResponsiveDrawer from "./components/Drawer/Drawer";
import Home from "./pages/Home/Home";
import CreateAuction from "./pages/CreateAuction/CreateAuction";
import MyAuctions from "./pages/MyAuctions/MyAuctions";
import Test from "./pages/Test/Test";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ResponsiveDrawer />}>
            <Route index element={<Home />} />
            <Route path="create" element={<CreateAuction />} />
            <Route path="manage" element={<MyAuctions />} />
            <Route path="test" element={<Test />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </ThemeProvider>
  );
}

export default App;


