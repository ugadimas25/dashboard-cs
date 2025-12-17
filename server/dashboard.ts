import { Request, Response } from "express";
import { db } from "./db";
import { originRaw, orbitRaw } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

// Get available periods (months/years) from summary_period
export async function getAvailablePeriods(req: Request, res: Response) {
  try {
    const { source = 'origin' } = req.query;
    
    const table = source === 'orbit' ? orbitRaw : originRaw;
    
    const periods = await db
      .selectDistinct({
        summary_period: table.summary_period,
      })
      .from(table)
      .where(sql`${table.summary_period} IS NOT NULL`)
      .orderBy(sql`${table.summary_period} DESC`);
    
    res.json(periods);
  } catch (error) {
    console.error('Error fetching periods:', error);
    res.status(500).json({ error: 'Failed to fetch periods' });
  }
}

// Get dashboard data based on source (origin/orbit) and period
export async function getDashboardData(req: Request, res: Response) {
  try {
    const { source = 'origin', month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }
    
    const table = source === 'orbit' ? orbitRaw : originRaw;
    
    const monthInt = parseInt(month as string);
    const yearInt = parseInt(year as string);
    
    // Build date filter for summary_period
    const periodFilter = sql`EXTRACT(MONTH FROM ${table.summary_period}) = ${monthInt} 
                             AND EXTRACT(YEAR FROM ${table.summary_period}) = ${yearInt}`;
    
    const data = await db
      .select()
      .from(table)
      .where(periodFilter);
    
    res.json({
      source,
      period: { month, year },
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

// Get aggregated statistics
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const { source = 'origin', month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }
    
    const monthInt = parseInt(month as string);
    const yearInt = parseInt(year as string);
    
    const periodFilter = (table: any) => 
      sql`EXTRACT(MONTH FROM ${table.summary_period}) = ${monthInt} 
          AND EXTRACT(YEAR FROM ${table.summary_period}) = ${yearInt}`;
    
    if (source === 'orbit') {
      const stats = await db
        .select({
          totalRows: sql<number>`COUNT(*)`,
        })
        .from(orbitRaw)
        .where(periodFilter(orbitRaw));
      
      return res.json({ source, period: { month, year }, stats: stats[0] });
    }
    
    // Origin stats
    const stats = await db
      .select({
        totalRows: sql<number>`COUNT(*)`,
      })
      .from(originRaw)
      .where(periodFilter(originRaw));
    
    res.json({ source, period: { month, year }, stats: stats[0] });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
