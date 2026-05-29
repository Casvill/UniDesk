import { createBrowserRouter } from "react-router-dom";

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

export const router = createBrowserRouter([
  /* PUBLIC ROUTES */
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

  /* PROTECTED LAYOUT */
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
        path: "settings",
        Component: Settings,
      },
    ],
  },

  /* STANDALONE ROUTE */
  {
    path: "/rooms/:roomId",
    Component: ActiveRoom,
  },

  /* 404 */
  {
    path: "*",
    Component: NotFound,
  },
]);