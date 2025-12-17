import { Request, Response } from "express";
import { db } from "./db";
import { originRaw, orbitRaw } from "@shared/schema";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { sql } from "drizzle-orm";
import pg from "pg";

const { Pool } = pg;

// Configure multer for memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Parse CSV and insert into database
export async function uploadCSV(req: Request, res: Response) {
  try {
    const { source, date } = req.body;
    
    if (!source || !date) {
      return res.status(400).json({ 
        error: 'Missing required fields: source, date' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results: any[] = [];
    const summaryPeriod = date; // Keep as string in YYYY-MM-DD format

    // Parse CSV
    const stream = Readable.from(req.file.buffer);
    
    // Check if file has headers by examining first line
    const fileContent = req.file.buffer.toString('utf-8');
    const firstLine = fileContent.split('\n')[0].toLowerCase();
    const hasHeaders = firstLine.includes('customer') || firstLine.includes('farmer') || firstLine.includes('name');
    
    // Detect delimiter (comma or semicolon)
    const commaCount = firstLine.split(',').length - 1;
    const semicolonCount = firstLine.split(';').length - 1;
    const delimiter = semicolonCount > commaCount ? ';' : ',';
    
    console.log(`Detected delimiter: ${delimiter}, Headers: ${hasHeaders}`);
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({ 
          separator: delimiter,
          headers: hasHeaders ? undefined : source === 'origin' ? [
            'Customer',
            'Customer_Number', 
            'Customer_Name',
            'Tenant_ID',
            'Tenant_URL',
            'Country_Name',
            'Latest_updated_date',
            'Active_Farmers',
            'Inactive_Farmers',
            'Mapped_Fields',
            'Unmapped_Fields',
            'Harvest_Bags',
            'Purchased_Bags',
            'Trainings',
            'Survey_Responses',
            'Web_Allowed_Users',
            'Web_Active_Users',
            'Web_Billable_Users',
            'Web_Not_Billed_Users',
            'Mobile_Allowed_Devices',
            'Mobile_Devices_with_linked_staff',
            'Mobile_Devices_with_no_staff',
            'Mobile_Billable_Users',
            'Mobile_Not_Billed_Users'
          ] : [
            'Customer_Name',
            'Tenant_URL',
            'Origin_Tenants',
            'Total_Farmers',
            'Total_Fields',
            'Total_Web_Users',
            'Total_Billable_Web_Users',
            'Total_Web_Users_Logged_in_The_Past_3_Months',
            'Total_Mobile_Users',
            'Total_Billable_Mobile_Users',
            'Total_Mobile_Users_Logged_in_The_Past_3_Months',
            'Survey_Reponses',
            'Trainings'
          ]
        }))
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      return res.status(400).json({ error: 'No data found in CSV file' });
    }

    // Extract month and year from date
    const uploadDate = new Date(summaryPeriod);
    const uploadMonth = uploadDate.getMonth() + 1; // 1-12
    const uploadYear = uploadDate.getFullYear();

    // Delete existing data for the same month and year using direct pool query
    const tableName = source === 'origin' ? 'origin_raw' : 'orbit_raw';
    
    try {
      // Create a new pool client for raw query
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      
      const deleteQuery = `
        DELETE FROM ${tableName}
        WHERE EXTRACT(MONTH FROM summary_period) = $1
        AND EXTRACT(YEAR FROM summary_period) = $2
      `;
      
      console.log(`Executing delete for ${tableName}: month=${uploadMonth}, year=${uploadYear}`);
      const deleteResult = await pool.query(deleteQuery, [uploadMonth, uploadYear]);
      console.log(`Deleted ${deleteResult.rowCount} existing records for ${uploadMonth}/${uploadYear}`);
      await pool.end();
    } catch (deleteError) {
      console.error('Delete error:', deleteError);
      throw deleteError;
    }

    // Insert data based on source
    let insertedCount = 0;

    if (source === 'origin') {
      for (const row of results) {
        await db.insert(originRaw).values({
          summary_period: summaryPeriod,
          Customer: row.Customer || null,
          Customer_Number: row.Customer_Number || null,
          Customer_Name: row.Customer_Name || null,
          Tenant_ID: row.Tenant_ID || null,
          Tenant_URL: row.Tenant_URL || null,
          Country_Name: row.Country_Name || null,
          Latest_updated_date: row.Latest_updated_date || null,
          Active_Farmers: parseFloat(row.Active_Farmers) || null,
          Inactive_Farmers: parseFloat(row.Inactive_Farmers) || null,
          Mapped_Fields: parseFloat(row.Mapped_Fields) || null,
          Unmapped_Fields: parseFloat(row.Unmapped_Fields) || null,
          Harvest_Bags: parseFloat(row.Harvest_Bags) || null,
          Purchased_Bags: parseFloat(row.Purchased_Bags) || null,
          Trainings: parseFloat(row.Trainings) || null,
          Survey_Responses: parseFloat(row.Survey_Responses) || null,
          Web_Allowed_Users: parseFloat(row.Web_Allowed_Users) || null,
          Web_Active_Users: parseFloat(row.Web_Active_Users) || null,
          Web_Billable_Users: parseFloat(row.Web_Billable_Users) || null,
          Web_Not_Billed_Users: parseFloat(row.Web_Not_Billed_Users) || null,
          Mobile_Allowed_Devices: parseFloat(row.Mobile_Allowed_Devices) || null,
          Mobile_Devices_with_linked_staff: parseFloat(row.Mobile_Devices_with_linked_staff) || null,
          Mobile_Devices_with_no_staff: parseFloat(row.Mobile_Devices_with_no_staff) || null,
          Mobile_Billable_Users: parseFloat(row.Mobile_Billable_Users) || null,
          Mobile_Not_Billed_Users: parseFloat(row.Mobile_Not_Billed_Users) || null,
        });
        insertedCount++;
      }
    } else if (source === 'orbit') {
      for (const row of results) {
        await db.insert(orbitRaw).values({
          summary_period: summaryPeriod,
          Customer_Name: row.Customer_Name || null,
          Tenant_URL: row.Tenant_URL || null,
          Origin_Tenants: parseBigInt(row.Origin_Tenants),
          Total_Farmers: parseBigInt(row.Total_Farmers),
          Total_Fields: parseBigInt(row.Total_Fields),
          Total_Web_Users: parseBigInt(row.Total_Web_Users),
          Total_Billable_Web_Users: parseBigInt(row.Total_Billable_Web_Users),
          Total_Web_Users_Logged_in_The_Past_3_Months: parseBigInt(row.Total_Web_Users_Logged_in_The_Past_3_Months),
          Total_Mobile_Users: parseBigInt(row.Total_Mobile_Users),
          Total_Billable_Mobile_Users: parseBigInt(row.Total_Billable_Mobile_Users),
          Total_Mobile_Users_Logged_in_The_Past_3_Months: parseBigInt(row.Total_Mobile_Users_Logged_in_The_Past_3_Months),
          Survey_Reponses: parseBigInt(row.Survey_Reponses),
          Trainings: parseBigInt(row.Trainings),
        });
        insertedCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedCount} records for ${source} (replaced data for ${uploadMonth}/${uploadYear})`,
      count: insertedCount,
      period: date
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process CSV file',
      details: error.message 
    });
  }
}

function parseBigInt(value: any): number | null {
  if (!value || value === '') return null;
  try {
    const num = parseFloat(String(value));
    return isNaN(num) ? null : Math.floor(num);
  } catch {
    return null;
  }
}
