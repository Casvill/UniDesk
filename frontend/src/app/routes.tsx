import { createBrowserRouter } from "react-router-dom";
import { Login } from "../modules/auth/components/Login";
import { Register } from "../modules/auth/components/Register";
import { Forgot as ForgotPassword } from "../modules/auth/components/ForgotPassword";
import { TopbarLayout } from "./TopbarLayout";
import { NotFound } from "../shared/components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword onSubmit={() => {}} />,
  },
  {
    path: "/dashboard",
    Component: TopbarLayout,
    children: [
      {
        index: true,
        element: <div>You are logged in.</div>,
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
