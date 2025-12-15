import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Papa from "papaparse";

export interface FarmData {
  partnerId: string;
  partnerName: string;
  projectCode: string;
  country: string;
  date: string;
  totalFarmers: number;
  yieldKg: number;
  activePlots: number;
  certifiedAreaHa: number;
}

const INITIAL_CSV = `10002 - Community Agribusiness Partners,10002,Community Agribusiness Partners,24747,cfm2,Malawi,11/26/2025,4301,39882,282,33845,0,0,2,1740,4,4,4,,7,7,3,7,0
10002 - Community Agribusiness Partners,10002,Community Agribusiness Partners,24749,cfrw3,Rwanda,11/26/2025,27812,16635,4,2,0,0,,121,2,3,2,1,6,6,5,6,0
10002 - Community Agribusiness Partners,10002,Community Agribusiness Partners,24750,cft2,United Republic of Tanzania,11/26/2025,26228,,215,4795,3,0,1027,680,2,3,2,1,3,3,0,3,1
10012 - Paltrack,10012,Paltrack,24793,srcc,South Africa,11/26/2025,91,,0,0,0,0,,356,6,4,4,,4,7,1,7,0
50048 - Anatrans SA,50048,Anatrans SA,24653,cadesacoop,Cote d'Ivoire,11/26/2025,2211,13,0,2581,0,0,,,5,7,5,2,15,0,1,0,1
50048 - Anatrans SA,50048,Anatrans SA,26125,anatrans2,Burkina Faso,11/26/2025,10558,,7225,4757,159250,154997,10155,18071,5,7,5,2,75,69,30,69,2
50048 - Anatrans SA,50048,Anatrans SA,26127,copavgon,Cote d'Ivoire,11/26/2025,518,,0,519,0,0,,,6,5,5,,8,3,1,3,0
50048 - Anatrans SA,50048,Anatrans SA,26277,iba,Togo,11/26/2025,1168,,1852,700,0,0,,,3,3,3,,7,7,1,7,0
50052 - Tininga Ltd,50052,Tininga Ltd,24771,hp,Papua New Guinea,11/26/2025,1554,,974,7972,20990,20760,2865,132,2,2,2,,4,3,14,3,0
50057 - Kutoka Ardhini Ltd,50057,Kutoka Ardhini Ltd,24758,fomd,Madagascar,11/26/2025,4482,,4930,2,7,0,240,6967,2,3,3,,9,7,1,7,0
50057 - Kutoka Ardhini Ltd,50057,Kutoka Ardhini Ltd,24807,kutokatz,United Republic of Tanzania,11/26/2025,1127,,1619,325,2537,2417,,2,2,2,2,,2,2,12,2,1
50057 - Kutoka Ardhini Ltd,50057,Kutoka Ardhini Ltd,24811,kutoka,Kenya,11/26/2025,12055,,14403,4689,50850,48841,16901,108284,5,6,6,,34,33,75,33,1
50059 - McCormick Global Ingredients Limited,50059,McCormick Global Ingredients Limited,10014,hs,Vietnam,11/26/2025,497,,498,0,4619,2047,,3708,6,10,6,4,3,3,15,3,0
50059 - McCormick Global Ingredients Limited,50059,McCormick Global Ingredients Limited,24650,agrispiceindonesia,Indonesia,11/26/2025,9096,70,9598,239,14753,12441,,9713,10,12,8,4,39,34,32,35,1
50059 - McCormick Global Ingredients Limited,50059,McCormick Global Ingredients Limited,24741,bio,Madagascar,11/26/2025,2616,2087,4621,375,18090,15346,4485,23668,5,6,5,1,27,23,0,23,1
50059 - McCormick Global Ingredients Limited,50059,McCormick Global Ingredients Limited,24783,pcv2,Vietnam,11/26/2025,585,144,1175,96,2001,1295,2243,1033,3,8,3,5,5,5,4,3,0
50059 - McCormick Global Ingredients Limited,50059,McCormick Global Ingredients Limited,24799,sv,Madagascar,11/26/2025,2590,1728,4465,421,6369,6016,2466,9506,8,12,8,4,18,18,3,18,0
50059 - McCormick Global Ingredients Limited,50059,McCormick Global Ingredients Limited,24805,vs,Vietnam,11/26/2025,504,644,2096,14,2601,1683,1030,1080,3,7,3,4,5,5,1,3,1
50059 - McCormick Global Ingredients Limited,50059,McCormick Global Ingredients Limited,26974,ppbrx,Brazil,11/26/2025,50,2,126,0,18,18,,,3,5,3,2,2,2,0,2,0
50059 - McCormick Global Ingredients Limited,50059,McCormick Global Ingredients Limited,27075,grancafe,Brazil,11/26/2025,37,,38,0,0,0,,,4,7,4,3,2,1,0,1,0`;

interface DataContextType {
  monthlyData: Record<string, FarmData[]>;
  currentMonth: string;
  availableMonths: string[];
  setCurrentMonth: (month: string) => void;
  uploadData: (csvContent: string, month: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [monthlyData, setMonthlyData] = useState<Record<string, FarmData[]>>({});
  const [currentMonth, setCurrentMonth] = useState("July 2025");

  const parseAndStore = (csv: string, month: string) => {
    Papa.parse(csv, {
      complete: (results) => {
        const parsed: FarmData[] = results.data
          .filter((row: any) => row.length > 5 && row[2]) 
          .map((row: any) => ({
            partnerId: row[1],
            partnerName: row[2],
            projectCode: row[4],
            country: row[5],
            date: row[6],
            totalFarmers: parseInt(row[7] || "0"),
            yieldKg: parseInt(row[8] || "0"),
            activePlots: parseInt(row[9] || "0"),
            certifiedAreaHa: parseInt(row[10] || "0"),
          }));
        
        setMonthlyData(prev => ({
          ...prev,
          [month]: parsed
        }));
        
        // Auto-switch to the new month if it's the first upload or explicitly requested
        if (Object.keys(monthlyData).length === 0) {
           // Initial load logic handled below
        }
      }
    });
  };

  useEffect(() => {
    if (Object.keys(monthlyData).length === 0) {
      parseAndStore(INITIAL_CSV, "July 2025");
    }
  }, []); // Run once on mount

  const uploadData = (csvContent: string, month: string) => {
    parseAndStore(csvContent, month);
    setCurrentMonth(month);
  };

  const availableMonths = Object.keys(monthlyData).sort();

  return (
    <DataContext.Provider value={{ 
      monthlyData, 
      currentMonth, 
      availableMonths,
      setCurrentMonth, 
      uploadData 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
