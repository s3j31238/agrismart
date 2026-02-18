import DashboardLayout from "@/component/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { crops } from "@/component/data/crops";
import { cropProblems } from "@/component/data/problems";
import { Users, Wheat, Bug, BarChart3, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = ["hsl(142,64%,36%)", "hsl(38,92%,50%)", "hsl(206,100%,50%)", "hsl(0,72%,51%)", "hsl(280,60%,50%)"];

export default function AdminPanel() {
  const { users } = useAuth();

  const userRoleData = [
    { name: "Farmers", value: users.filter(u => u.role === "farmer").length },
    { name: "Students", value: users.filter(u => u.role === "student").length },
    { name: "Admins", value: users.filter(u => u.role === "admin").length },
  ];

  const cropSeasonData = [
    { season: "Kharif", count: crops.filter(c => c.season === "Kharif").length },
    { season: "Rabi", count: crops.filter(c => c.season === "Rabi").length },
    { season: "Both", count: crops.filter(c => c.season.includes("/")).length },
  ];

  const problemTypeData = [
    { type: "Pest", count: cropProblems.filter(p => p.type === "Pest").length },
    { type: "Disease", count: cropProblems.filter(p => p.type === "Disease").length },
    { type: "Nutrient", count: cropProblems.filter(p => p.type === "Nutrient Deficiency").length },
    { type: "Water", count: cropProblems.filter(p => p.type === "Water Issue").length },
  ];

  const topCities = [
    { city: "Delhi", searches: 142 },
    { city: "Mumbai", searches: 118 },
    { city: "Pune", searches: 95 },
    { city: "Jaipur", searches: 87 },
    { city: "Lucknow", searches: 73 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        <div>
          <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Manage platform data and view analytics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Users", value: users.length, icon: Users, color: "gradient-primary" },
            { label: "Crops", value: crops.length, icon: Wheat, color: "gradient-primary" },
            { label: "Problems", value: cropProblems.length, icon: Bug, color: "gradient-warm" },
            { label: "Cities Tracked", value: topCities.length, icon: Search, color: "gradient-sky" },
          ].map(s => (
            <div key={s.label} className="card-agri">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-agri">
            <h3 className="font-semibold text-foreground mb-4">User Roles</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userRoleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                    {userRoleData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-agri">
            <h3 className="font-semibold text-foreground mb-4">Crops by Season</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropSeasonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                  <XAxis dataKey="season" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(142,64%,36%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-agri">
            <h3 className="font-semibold text-foreground mb-4">Problem Types</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={problemTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="type" type="category" fontSize={12} width={70} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(38,92%,50%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-agri">
            <h3 className="font-semibold text-foreground mb-4">Most Searched Cities</h3>
            <div className="space-y-3">
              {topCities.map((c, i) => (
                <div key={c.city} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm text-foreground flex-1">{c.city}</span>
                  <div className="w-32 h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full gradient-primary rounded-full" style={{ width: `${(c.searches / 142) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{c.searches}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card-agri">
          <h3 className="font-semibold text-foreground mb-4">Registered Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Email</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Role</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 px-3 text-foreground">{u.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-destructive/10 text-destructive" : u.role === "farmer" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{u.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

