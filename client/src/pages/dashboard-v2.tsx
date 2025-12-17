import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Upload, FileUp, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type DataSource = 'origin' | 'orbit';

export default function DashboardV2() {
  const [dataSource, setDataSource] = useState<DataSource>('origin');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadDate, setUploadDate] = useState<Date | undefined>(undefined);
  const [detectedSource, setDetectedSource] = useState<'origin' | 'orbit' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    ? Array.from(new Set(periods.map((p: any) => new Date(p.summary_period).getFullYear()))) as number[]
    : [];

  const sortedYears = availableYears.sort((a, b) => b - a);

  const availableMonths = periods && selectedYear
    ? (Array.from(
        new Set(
          periods
            .filter((p: any) => new Date(p.summary_period).getFullYear() === parseInt(selectedYear))
            .map((p: any) => new Date(p.summary_period).getMonth() + 1)
        )
      ) as number[]).sort((a, b) => a - b)
    : [];

  // Set default year and month when periods load
  useEffect(() => {
    if (sortedYears.length > 0 && !selectedYear) {
      setSelectedYear(sortedYears[0].toString());
    }
  }, [sortedYears, selectedYear]);

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
            <h1 className="text-3xl font-bold tracking-tight">Upload FOOD Report Files</h1>
            <p className="text-muted-foreground mt-1">Monitor and analyze your data</p>
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
                  <Label htmlFor="upload-date" className="text-base font-semibold">Summary Period Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="upload-date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-14 text-base border-2 hover:border-primary transition-colors"
                      >
                        <CalendarIcon className="mr-3 h-5 w-5" />
                        {uploadDate ? format(uploadDate, 'MMMM dd, yyyy') : <span className="text-muted-foreground">Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center" sideOffset={8}>
                      <div className="p-6 bg-white rounded-xl shadow-2xl border">
                        <Calendar
                          mode="single"
                          selected={uploadDate}
                          onSelect={setUploadDate}
                          initialFocus
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center mb-4",
                            caption_label: "text-xl font-bold",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-10 w-10 bg-transparent p-0 hover:bg-primary/10 rounded-lg",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex mb-2",
                            head_cell: "text-muted-foreground rounded-md w-14 font-semibold text-sm uppercase",
                            row: "flex w-full mt-2",
                            cell: "h-14 w-14 text-center text-base p-0 relative focus-within:relative focus-within:z-20",
                            day: "h-14 w-14 p-0 font-semibold text-base hover:bg-primary/10 hover:rounded-xl transition-all duration-200",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-xl font-bold",
                            day_today: "bg-accent text-accent-foreground rounded-xl font-bold",
                            day_outside: "text-muted-foreground opacity-30",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_hidden: "invisible",
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-muted-foreground">
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
                  {sortedYears.map((year: number) => (
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
                  {availableMonths.map((month: number) => (
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
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1 max-w-sm">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          </div>
        ) : stats?.stats ? (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1 max-w-sm">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Row</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.stats.totalRows?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
