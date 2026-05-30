import { Forgot } from "../components/ForgotPassword";

export default function ForgotPage() {
  const handleForgot = () => {
    // Aquí irá Firebase más adelante
    console.log("Correo de recuperación enviado");
  };

  return <Forgot onSubmit={handleForgot} />;
}