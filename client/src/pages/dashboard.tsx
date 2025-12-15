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
  Legend
} from "recharts";
import { Upload, Users, Sprout, Map, Scale } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const { data, currentMonth, uploadData } = useData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMonth, setSelectedMonth] = useState("August 2025");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Aggregations
  const totalFarmers = data.reduce((acc, curr) => acc + curr.totalFarmers, 0);
  const totalYield = data.reduce((acc, curr) => acc + curr.yieldKg, 0);
  const totalArea = data.reduce((acc, curr) => acc + curr.certifiedAreaHa, 0);
  const activePlots = data.reduce((acc, curr) => acc + curr.activePlots, 0);

  // Chart Data Preparation
  const yieldByCountry = Object.values(data.reduce((acc: any, curr) => {
    if (!acc[curr.country]) {
      acc[curr.country] = { name: curr.country, value: 0 };
    }
    acc[curr.country].value += curr.yieldKg;
    return acc;
  }, {}));

  const farmersByPartner = Object.values(data.reduce((acc: any, curr) => {
    // Shorten partner name for display
    const shortName = curr.partnerName.length > 15 ? curr.partnerName.substring(0, 15) + '...' : curr.partnerName;
    if (!acc[curr.partnerName]) {
      acc[curr.partnerName] = { name: shortName, value: 0 };
    }
    acc[curr.partnerName].value += curr.totalFarmers;
    return acc;
  }, {})).sort((a: any, b: any) => b.value - a.value).slice(0, 5); // Top 5 partners

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        uploadData(text, selectedMonth);
        setIsDialogOpen(false);
        toast({
          title: "Data Added Successfully",
          description: `Data for ${selectedMonth} has been added to the dashboard summary.`,
        });
      };
      reader.readAsText(file);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Overview</h1>
            <p className="text-muted-foreground mt-1">
              Cumulative Data Summary (Latest: <span className="font-semibold text-primary">{currentMonth}</span>)
            </p>
          </div>
          
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
                  Select the month and upload the corresponding file to update the dashboard.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-elevate transition-all border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFarmers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active across all regions</p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalYield / 1000).toLocaleString()} t</div>
              <p className="text-xs text-muted-foreground">Metric tons produced</p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-chart-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certified Area</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalArea.toLocaleString()} ha</div>
              <p className="text-xs text-muted-foreground">Hectares under management</p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-chart-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plots</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePlots.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Plots currently cultivated</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Bar Chart */}
          <Card className="col-span-4 hover-elevate transition-all">
            <CardHeader>
              <CardTitle>Production by Country</CardTitle>
              <CardDescription>Yield distribution (kg) across different regions</CardDescription>
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

          {/* Pie Chart */}
          <Card className="col-span-3 hover-elevate transition-all">
            <CardHeader>
              <CardTitle>Farmers by Partner</CardTitle>
              <CardDescription>Top 5 partners by farmer count</CardDescription>
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

        {/* Recent Data Table Preview */}
        <Card className="hover-elevate transition-all">
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>Latest data points from the uploaded file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Partner</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Farmers</th>
                    <th className="px-4 py-3">Yield (kg)</th>
                    <th className="px-4 py-3 rounded-r-lg">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{row.partnerName}</td>
                      <td className="px-4 py-3">{row.country}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary-foreground">{row.projectCode}</span></td>
                      <td className="px-4 py-3">{row.totalFarmers.toLocaleString()}</td>
                      <td className="px-4 py-3">{row.yieldKg.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
