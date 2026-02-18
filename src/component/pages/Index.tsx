import { Link } from "react-router-dom";
import { Leaf, CloudSun, Bug, CalendarDays, BarChart3, ShieldCheck, ArrowRight, Sprout, Users, TrendingUp } from "lucide-react";
import { Button } from "@/component/ui/button";
import { useLang } from "@/contexts/LangContext";
import LangToggle from "@/component/LangToggle";

export default function Index() {
  const { t } = useLang();

  const features = [
    { icon: CloudSun, title: "Live Weather Intelligence", desc: "Real-time weather with geolocation, smart farming advisories and auto-refresh every 10 minutes." },
    { icon: Leaf, title: t.nav.cropAdvisor, desc: "Smart crop suggestions based on soil type, season, temperature, and rainfall with detailed explanations." },
    { icon: Bug, title: t.nav.problemSolver, desc: "Diagnose pests, diseases, and nutrient deficiencies with step-by-step treatment plans." },
    { icon: CalendarDays, title: t.nav.dailyPlanner, desc: "Smart crop care schedules with irrigation, fertilizer, and harvest countdown timers." },
    { icon: BarChart3, title: "Profit Estimator", desc: "Estimate yield, market price, and revenue for informed farming decisions." },
    { icon: ShieldCheck, title: "Secure Platform", desc: "Role-based access for farmers, students, and administrators with session management." },
  ];

  const stats = [
    { icon: Sprout, value: "18+", label: "Crops in Database" },
    { icon: Users, value: "3", label: "User Roles" },
    { icon: TrendingUp, value: "100%", label: "Free to Use" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold text-foreground">{t.appName}</span>
            <p className="text-[10px] text-muted-foreground leading-none">{t.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm" className="font-medium">{t.nav.signIn}</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="font-semibold">{t.nav.getStarted}</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-24 md:py-36 text-center max-w-5xl mx-auto overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-primary/8 rounded-full blur-2xl" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8 border border-primary/20">
          <Leaf className="w-4 h-4" /> {t.landing.badge}
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
          {t.landing.heroTitle}{" "}
          <span className="text-gradient">{t.landing.heroTitleHighlight}</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
          {t.landing.heroDesc}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="text-base px-10 py-6 gap-2 font-bold shadow-md hover:shadow-lg transition-shadow">
              {t.landing.getStartedFree} <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="text-base px-10 py-6 font-semibold border-2">
              {t.nav.signIn}
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-16">
          {stats.map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-1">
                <s.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-extrabold text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-3">{t.landing.features}</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">{t.landing.featuresDesc}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-sm">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card-agri gradient-primary rounded-2xl p-10">
            <h2 className="text-3xl font-extrabold text-primary-foreground mb-4">
              {t.landing.heroTitle} {t.landing.heroTitleHighlight}!
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">{t.landing.heroDesc}</p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-base px-10 py-6 font-bold">
                {t.landing.getStartedFree} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>{t.landing.footer}</p>
      </footer>
    </div>
  );
}

