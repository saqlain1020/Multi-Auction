import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home/Home";
import Test from "../pages/Test/Test";
const routes = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/test",
    element: <Test />,
  },
]);

export default routes;
