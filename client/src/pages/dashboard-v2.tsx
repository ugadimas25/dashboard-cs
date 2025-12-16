import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Upload, FileUp, CalendarIcon } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type DataSource = 'origin' | 'orbit';
type SortDirection = 'asc' | 'desc' | null;

export default function DashboardV2() {
  const [dataSource, setDataSource] = useState<DataSource>('origin');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadDate, setUploadDate] = useState<Date | undefined>(undefined);
  const [detectedSource, setDetectedSource] = useState<'origin' | 'orbit' | null>(null);
  const [chartGroupBy, setChartGroupBy] = useState<'country' | 'customer'>('country');
  const [chartMetric, setChartMetric] = useState<'farmers' | 'fields' | 'users'>('farmers');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available periods
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['periods', dataSource],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/periods?source=${dataSource}`);
      if (!res.ok) throw new Error('Failed to fetch periods');
      return res.json();
    },
  });

  // Extract unique months and years
  const availableYears = periods
    ? [...new Set(periods.map((p: any) => new Date(p.summary_period).getFullYear()))]
        .sort((a, b) => b - a)
    : [];

  const availableMonths = periods && selectedYear
    ? [
        ...new Set(
          periods
            .filter((p: any) => new Date(p.summary_period).getFullYear() === parseInt(selectedYear))
            .map((p: any) => new Date(p.summary_period).getMonth() + 1)
        ),
      ].sort((a, b) => a - b)
    : [];

  // Set default year and month when periods load
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0].toString());
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0].toString());
    }
  }, [availableMonths, selectedMonth]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', dataSource, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!selectedMonth || !selectedYear) return null;
      const res = await fetch(
        `/api/dashboard/stats?source=${dataSource}&month=${selectedMonth}&year=${selectedYear}`
      );
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!selectedMonth && !!selectedYear,
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dataLoading } = useQuery({
    queryKey: ['dashboard-data', dataSource, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!selectedMonth || !selectedYear) return null;
      const res = await fetch(
        `/api/dashboard/data?source=${dataSource}&month=${selectedMonth}&year=${selectedYear}`
      );
      if (!res.ok) throw new Error('Failed to fetch data');
      return res.json();
    },
    enabled: !!selectedMonth && !!selectedYear,
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    if (!dashboardData?.data) return [];
    
    let filtered = dashboardData.data.filter((row: any) => {
      const searchLower = searchTerm.toLowerCase();
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchLower)
      );
    });

    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a: any, b: any) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal || '');
        const bStr = String(bVal || '');
        return sortDirection === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [dashboardData?.data, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortColumn, sortDirection, dataSource, selectedMonth, selectedYear]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(
        sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') setSortColumn(null);
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Chart data with dynamic grouping and metrics
  const chartData = useMemo(() => {
    if (!dashboardData?.data || dashboardData.data.length === 0) return [];
    
    const groupMap = new Map();
    
    dashboardData.data.forEach((row: any) => {
      let groupKey: string;
      
      // Determine group key based on selection
      if (chartGroupBy === 'country') {
        groupKey = (dataSource === 'orbit' ? 'N/A' : row.Country_Name) || 'Unknown';
      } else {
        groupKey = row.Customer_Name || 'Unknown';
      }
      
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          name: groupKey.substring(0, 30),
          farmers: 0,
          fields: 0,
          users: 0,
        });
      }
      
      const entry = groupMap.get(groupKey);
      
      // Add metrics based on data source
      if (dataSource === 'orbit') {
        entry.farmers += row.Total_Farmers || 0;
        entry.fields += row.Total_Fields || 0;
        entry.users += row.Total_Web_Users || 0;
      } else {
        entry.farmers += row.Active_Farmers || 0;
        entry.fields += row.Mapped_Fields || 0;
        entry.users += row.Web_Billable_Users || 0;
      }
    });
    
    // Sort by selected metric and return top 10
    return Array.from(groupMap.values())
      .sort((a, b) => b[chartMetric] - a[chartMetric])
      .slice(0, 10);
  }, [dashboardData, dataSource, chartGroupBy, chartMetric]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  // Auto-detect source from filename
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const filename = file.name.toUpperCase();
      if (filename.includes('ORIGIN')) {
        setDetectedSource('origin');
      } else if (filename.includes('ORBIT')) {
        setDetectedSource('orbit');
      } else {
        setDetectedSource(null);
      }
    }
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!uploadDate) {
        throw new Error('Please select a date');
      }
      if (!detectedSource) {
        throw new Error('Cannot detect data source from filename. Please ensure filename contains "ORIGIN" or "ORBIT"');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', detectedSource);
      formData.append('date', format(uploadDate, 'yyyy-MM-dd'));

      const res = await fetch('/api/dashboard/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      
      // Auto-switch to uploaded data source and period
      if (detectedSource) {
        setDataSource(detectedSource);
      }
      
      if (uploadDate) {
        const uploadYear = uploadDate.getFullYear().toString();
        const uploadMonth = (uploadDate.getMonth() + 1).toString();
        setSelectedYear(uploadYear);
        setSelectedMonth(uploadMonth);
      }
      
      setIsUploadOpen(false);
      setUploadDate(undefined);
      setDetectedSource(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Farmforce Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor and analyze your farm data</p>
          </div>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="lg">
                <Upload className="h-4 w-4" />
                Upload CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload {detectedSource ? (detectedSource === 'origin' ? 'Origin' : 'Orbit') : ''} Data</DialogTitle>
                <DialogDescription>
                  {detectedSource 
                    ? `Upload CSV file for ${detectedSource === 'origin' ? 'Origin' : 'Orbit'} data source. Date will be used for summary_period column.`
                    : 'Select a CSV file. Source will be auto-detected from filename (must contain "ORIGIN" or "ORBIT")'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-date">Summary Period Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="upload-date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {uploadDate ? format(uploadDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={uploadDate}
                        onSelect={setUploadDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    This date will be saved to the summary_period column
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-upload">CSV File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  {detectedSource && (
                    <p className="text-xs text-green-600">
                      ✓ Detected: {detectedSource === 'origin' ? 'Origin' : 'Orbit'} data source
                    </p>
                  )}
                  {!detectedSource && fileInputRef.current?.files?.[0] && (
                    <p className="text-xs text-orange-600">
                      ⚠ Cannot detect source. Ensure filename contains "ORIGIN" or "ORBIT"
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    const file = fileInputRef.current?.files?.[0];
                    if (file) {
                      uploadMutation.mutate(file);
                    }
                  }}
                  disabled={uploadMutation.isPending || !uploadDate || !detectedSource}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <FileUp className="mr-2 h-4 w-4 animate-pulse" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Select data source and period</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            {/* Radio Button for Data Source */}
            <div className="space-y-2">
              <Label>Data Source</Label>
              <RadioGroup value={dataSource} onValueChange={(value) => setDataSource(value as DataSource)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="origin" id="origin" />
                  <Label htmlFor="origin">Origin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="orbit" id="orbit" />
                  <Label htmlFor="orbit">Orbit</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Year Filter */}
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear} disabled={periodsLoading}>
                <SelectTrigger id="year" className="w-[150px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Filter */}
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={periodsLoading || !selectedYear}>
                <SelectTrigger id="month" className="w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {monthNames[month - 1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        {statsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats?.stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {dataSource === 'orbit' ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Farmers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.totalFarmers?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Fields</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.totalFields?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Web Users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.totalWebUsers?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Mobile Users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.totalMobileUsers?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Active Farmers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.totalActiveFarmers?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Mapped Fields</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.totalMappedFields?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Harvest Bags</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.totalHarvestBags?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Trainings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.stats.totalTrainings?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        ) : null}

        {/* Charts Section */}
        {!dataLoading && chartData.length > 0 && (
          <div className="space-y-4">
            {/* Chart Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Chart Configuration</CardTitle>
                <CardDescription>Customize chart grouping and metrics</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4 flex-wrap">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <label className="text-sm font-medium">Group By</label>
                  <Select value={chartGroupBy} onValueChange={(val: 'country' | 'customer') => setChartGroupBy(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="country">Country{dataSource === 'orbit' ? ' (N/A for Orbit)' : ''}</SelectItem>
                      <SelectItem value="customer">Customer Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <label className="text-sm font-medium">Metric</label>
                  <Select value={chartMetric} onValueChange={(val: 'farmers' | 'fields' | 'users') => setChartMetric(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmers">{dataSource === 'orbit' ? 'Total Farmers' : 'Active Farmers'}</SelectItem>
                      <SelectItem value="fields">{dataSource === 'orbit' ? 'Total Fields' : 'Mapped Fields'}</SelectItem>
                      <SelectItem value="users">{dataSource === 'orbit' ? 'Total Web Users' : 'Web Billable Users'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 by {chartMetric === 'farmers' ? 'Farmers' : chartMetric === 'fields' ? 'Fields' : 'Users'}</CardTitle>
                  <CardDescription>Grouped by {chartGroupBy === 'country' ? 'Country' : 'Customer'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey={chartMetric} 
                        fill="#8884d8" 
                        name={chartMetric === 'farmers' ? 'Farmers' : chartMetric === 'fields' ? 'Fields' : 'Users'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution by {chartMetric === 'farmers' ? 'Farmers' : chartMetric === 'fields' ? 'Fields' : 'Users'}</CardTitle>
                  <CardDescription>Pie chart grouped by {chartGroupBy === 'country' ? 'Country' : 'Customer'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey={chartMetric}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{dataSource === 'orbit' ? 'Orbit' : 'Origin'} Data</CardTitle>
                <CardDescription>
                  Showing {paginatedData.length} of {filteredAndSortedData.length} records
                  {selectedMonth && ` for ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[250px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : paginatedData.length > 0 ? (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {dataSource === 'orbit' ? (
                          <>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Customer_Name')} className="h-8 px-2">
                                Customer Name
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Total_Farmers')} className="h-8 px-2">
                                Total Farmers
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Total_Fields')} className="h-8 px-2">
                                Total Fields
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Total_Billable_Web_Users')} className="h-8 px-2">
                                Web Users
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Total_Billable_Mobile_Users')} className="h-8 px-2">
                                Mobile Users
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Trainings')} className="h-8 px-2">
                                Trainings
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Customer_Name')} className="h-8 px-2">
                                Customer Name
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Country_Name')} className="h-8 px-2">
                                Country
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Active_Farmers')} className="h-8 px-2">
                                Active Farmers
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Mapped_Fields')} className="h-8 px-2">
                                Mapped Fields
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Web_Billable_Users')} className="h-8 px-2">
                                Web Users
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" onClick={() => handleSort('Mobile_Billable_Users')} className="h-8 px-2">
                                Mobile Users
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((row: any, idx: number) => (
                        <TableRow key={idx}>
                          {dataSource === 'orbit' ? (
                            <>
                              <TableCell className="font-medium">{row.Customer_Name}</TableCell>
                              <TableCell>{row.Total_Farmers?.toLocaleString()}</TableCell>
                              <TableCell>{row.Total_Fields?.toLocaleString()}</TableCell>
                              <TableCell>{row.Total_Billable_Web_Users?.toLocaleString()}</TableCell>
                              <TableCell>{row.Total_Billable_Mobile_Users?.toLocaleString()}</TableCell>
                              <TableCell>{row.Trainings?.toLocaleString()}</TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="font-medium">{row.Customer_Name}</TableCell>
                              <TableCell>{row.Country_Name}</TableCell>
                              <TableCell>{row.Active_Farmers?.toLocaleString()}</TableCell>
                              <TableCell>{row.Mapped_Fields?.toLocaleString()}</TableCell>
                              <TableCell>{row.Web_Billable_Users?.toLocaleString()}</TableCell>
                              <TableCell>{row.Mobile_Billable_Users?.toLocaleString()}</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? 'No results found' : 'No data available for the selected period'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
