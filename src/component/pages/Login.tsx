import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { useToast } from "@/component/hooks/use-toast";
import LangToggle from "@/component/LangToggle";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate("/dashboard");
    } else {
      toast({ title: t.login.loginFailed, description: t.login.invalidCredentials, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <LangToggle />
      </div>
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5 shadow-md">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.login.welcome}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.login.subtitle}</p>
        </div>

        <div className="card-agri">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">{t.login.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10 h-11" required type="email" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">{t.login.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 h-11" required type={showPw ? "text" : "password"} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-bold">{t.login.signIn}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5">
            {t.login.noAccount}{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">{t.login.register}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}


