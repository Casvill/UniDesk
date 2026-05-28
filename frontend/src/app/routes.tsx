import { createBrowserRouter } from "react-router-dom";
import { Login } from "../modules/auth/components/Login";
import { Register } from "../modules/auth/components/Register";
import { ForgotPassword } from "../modules/auth/components/ForgotPassword";
import { TopbarLayout } from "./TopbarLayout";
import { Dashboard } from "../modules/dashboard/components/Dashboard";
import { RoomList } from "../modules/room/components/RoomList";
import { CreateRoom } from "../modules/room/components/CreateRoom";
import { JoinRoom } from "../modules/room/components/JoinRoom";
import { ActiveRoom } from "../modules/room/components/ActiveRoom";
import { UserProfile } from "../modules/users/components/UserProfile";
import { Settings } from "../shared/components/Settings";
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
    Component: ForgotPassword,
  },
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
  {
    path: "/rooms/:roomId",
    Component: ActiveRoom,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
