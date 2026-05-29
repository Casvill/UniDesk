import { createBrowserRouter, Navigate } from "react-router-dom";

/* PAGES (NO COMPONENTS DIRECTOS) */
import LoginPage from "../modules/auth/pages/LoginPage";
import RegisterPage from "../modules/auth/pages/Register";
import ForgotPassword from "../modules/auth/pages/ForgotPage";

/* LAYOUT */
import { TopbarLayout } from "./TopbarLayout";

/* PROTECTED PAGES */
import { Dashboard } from "../modules/dashboard/components/Dashboard";
import { RoomList } from "../modules/room/components/RoomList";
import { CreateRoom } from "../modules/room/components/CreateRoom";
import { JoinRoom } from "../modules/room/components/JoinRoom";
import { ActiveRoom } from "../modules/room/components/ActiveRoom";
import { UserProfile } from "../modules/users/components/UserProfile";
import { Settings } from "../shared/components/Settings";
import { NotFound } from "../shared/components/NotFound";

/* AUTH GUARDS */
import ProtectedRoute from "../shared/components/ProtectedRoute";
import PublicRoute from "../shared/components/PublicRoute";

export const router = createBrowserRouter([
  /* PUBLIC ROUTES */
  {
    element: <PublicRoute />,
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
        Component: ForgotPassword,
      },
    ]
  },

  /* PROTECTED LAYOUT */
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <TopbarLayout />,
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
            path: "settings",
            Component: Settings,
          },
        ],
      },
      /* STANDALONE PROTECTED ROUTE */
      {
        path: "/rooms/:roomId",
        Component: ActiveRoom,
      },
    ],
  },

  /* 404 */
  {
    path: "*",
    Component: NotFound,
  },
]);