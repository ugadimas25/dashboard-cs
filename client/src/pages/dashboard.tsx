import { useData } from "@/lib/data";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";
import { Upload, Users, Sprout, Map, Scale, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const { monthlyData, currentMonth, availableMonths, setCurrentMonth, uploadData } = useData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMonth, setUploadMonth] = useState("August 2025");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get data for the currently selected view
  const currentData = monthlyData[currentMonth] || [];

  // Aggregations for current month
  const totalFarmers = currentData.reduce((acc, curr) => acc + curr.totalFarmers, 0);
  const totalYield = currentData.reduce((acc, curr) => acc + curr.yieldKg, 0);
  const totalArea = currentData.reduce((acc, curr) => acc + curr.certifiedAreaHa, 0);
  const activePlots = currentData.reduce((acc, curr) => acc + curr.activePlots, 0);

  // Chart Data Preparation (Current Month)
  const yieldByCountry = Object.values(currentData.reduce((acc: any, curr) => {
    if (!acc[curr.country]) {
      acc[curr.country] = { name: curr.country, value: 0 };
    }
    acc[curr.country].value += curr.yieldKg;
    return acc;
  }, {}));

  const farmersByPartner = Object.values(currentData.reduce((acc: any, curr) => {
    const shortName = curr.partnerName.length > 15 ? curr.partnerName.substring(0, 15) + '...' : curr.partnerName;
    if (!acc[curr.partnerName]) {
      acc[curr.partnerName] = { name: shortName, value: 0 };
    }
    acc[curr.partnerName].value += curr.totalFarmers;
    return acc;
  }, {})).sort((a: any, b: any) => b.value - a.value).slice(0, 5);

  // Monthly Analytics Data (Trend)
  const monthlyTrends = availableMonths.map(month => {
    const monthData = monthlyData[month];
    return {
      name: month,
      farmers: monthData.reduce((acc, curr) => acc + curr.totalFarmers, 0),
      yield: monthData.reduce((acc, curr) => acc + curr.yieldKg, 0),
      area: monthData.reduce((acc, curr) => acc + curr.certifiedAreaHa, 0)
    };
  });

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        uploadData(text, uploadMonth);
        setIsDialogOpen(false);
        toast({
          title: "Data Added Successfully",
          description: `Data for ${uploadMonth} has been uploaded.`,
        });
      };
      reader.readAsText(file);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Overview</h1>
            <p className="text-muted-foreground mt-1">
              Monthly Snapshot: <span className="font-semibold text-primary">{currentMonth}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {currentMonth}
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableMonths.map(month => (
                  <DropdownMenuItem key={month} onClick={() => setCurrentMonth(month)}>
                    {month}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                  <Upload size={18} />
                  Upload Monthly Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Excel/CSV Data</DialogTitle>
                  <DialogDescription>
                    Select the month and upload the file. This will create a new monthly record.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Month</Label>
                    <Select value={uploadMonth} onValueChange={setUploadMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="August 2025">August 2025</SelectItem>
                        <SelectItem value="September 2025">September 2025</SelectItem>
                        <SelectItem value="October 2025">October 2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>File (CSV)</Label>
                    <Input 
                      type="file" 
                      accept=".csv,.txt" 
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-elevate transition-all border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFarmers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active in {currentMonth}</p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalYield / 1000).toLocaleString()} t</div>
              <p className="text-xs text-muted-foreground">Metric tons in {currentMonth}</p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-chart-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certified Area</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalArea.toLocaleString()} ha</div>
              <p className="text-xs text-muted-foreground">Hectares in {currentMonth}</p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-chart-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plots</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePlots.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Plots in {currentMonth}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section (Current Month) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 hover-elevate transition-all">
            <CardHeader>
              <CardTitle>Production by Country ({currentMonth})</CardTitle>
              <CardDescription>Yield distribution (kg)</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={yieldByCountry}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3 hover-elevate transition-all">
            <CardHeader>
              <CardTitle>Farmers by Partner ({currentMonth})</CardTitle>
              <CardDescription>Top 5 partners</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={farmersByPartner}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {farmersByPartner.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Analytics Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Monthly Analytic</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover-elevate transition-all">
              <CardHeader>
                <CardTitle>Yield Trend</CardTitle>
                <CardDescription>Total production over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="yield" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all">
              <CardHeader>
                <CardTitle>Farmer Growth</CardTitle>
                <CardDescription>Total farmers over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="farmers" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--secondary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
