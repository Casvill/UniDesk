import { useNavigate } from "react-router-dom";
import { Register } from "../components/Register";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleRegister = () => {
    
  navigate("/"); 
};

  return <Register onSubmit={handleRegister} />;
}