import { useNavigate } from "react-router-dom";
import { Login } from "../components/Login";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // aquí luego:
    // - API login
    // - Firebase
    // - JWT
    // - validaciones

    navigate("/dashboard");
  };

  return <Login onSubmit={handleLogin} />;
}