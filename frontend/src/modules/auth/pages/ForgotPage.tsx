import { useNavigate } from "react-router-dom";
import { Forgot } from "../components/ForgotPassword";

export default function ForgotPage() {
  const navigate = useNavigate();

  const handleForgot = () => {
    
  navigate("/"); 
};

  return <Forgot onSubmit={handleForgot} />;
}