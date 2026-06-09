import { createBrowserRouter } from "react-router-dom";

/* PAGES (NO COMPONENTS DIRECTOS) */
import LoginPage from "../modules/auth/pages/LoginPage";
import RegisterPage from "../modules/auth/pages/Register";
import Forgot from "../modules/auth/pages/ForgotPage";
import GoogleprofilePage from "../modules/auth/pages/GooglePage";

/* LAYOUT */
import { TopbarLayout } from "./TopbarLayout";
import AuthLayout from "@/modules/auth/AuthLayout";

/* PROTECTED PAGES */
import ProtectedRoute from "../shared/components/ProtectedRoute";
import { Dashboard } from "../modules/dashboard/components/Dashboard";
import { RoomList } from "../modules/room/components/RoomList";
import { CreateRoom } from "../modules/room/components/CreateRoom";
import { JoinRoom } from "../modules/room/components/JoinRoom";
import { ActiveRoom } from "../modules/room/components/ActiveRoom";
import { UserProfile } from "../modules/users/components/UserProfile";
import { MyProfile } from "../modules/users/components/MyProfile";
import { NotFound } from "../shared/components/NotFound";

import PublicRoute from "../shared/components/PublicRoute";

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/",
            Component: LoginPage,
          },
          {
            path: "/register",
            Component: RegisterPage,
          },
          {
            path: "/forgot-password",
            Component: Forgot,
          },
          {
            path: "/google-profile",
            Component: GoogleprofilePage,
          },
        ],
      },
    ],
    },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        Component: TopbarLayout,
        children: [
          {
            path: "dashboard",
            Component: Dashboard,
          },
          {
            path: "rooms",
            Component: RoomList,
          },
          {
            path: "rooms/create",
            Component: CreateRoom,
          },
          {
            path: "rooms/join/:roomId",
            Component: JoinRoom,
          },
          {
            path: "profile",
            Component: UserProfile,
          },
          {
            path: "my-profile",
            Component: MyProfile,
          },
        ],
      },
      {
        path: "/rooms/:roomId",
        Component: ActiveRoom,
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);