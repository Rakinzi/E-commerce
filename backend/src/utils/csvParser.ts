import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { z } from 'zod';
import logger from './logger.js';

export interface CSVProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  stock: number;
  sku: string;
  tags?: string[];
}

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.union([
    z.string().transform((val) => {
      const cleaned = val.replace(/[$,]/g, '').trim();
      const price = parseFloat(cleaned);
      if (isNaN(price) || price < 0) throw new Error(`Invalid price: ${val}`);
      return price;
    }),
    z.number().min(0, 'Price must be positive')
  ]),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Subcategory is required'),
  stock: z.union([
    z.string().transform((val) => {
      const cleaned = val.trim();
      const stock = parseInt(cleaned);
      if (isNaN(stock) || stock < 0) throw new Error(`Invalid stock: ${val}`);
      return stock;
    }),
    z.number().int().min(0, 'Stock must be non-negative')
  ]),
  sku: z.string().min(1, 'SKU is required'),
  tags: z.string().optional().transform((val) => {
    if (!val || !val.trim()) return [];
    return val.split(';').map(tag => tag.trim()).filter(tag => tag);
  }),
  active: z.string().optional().transform((val) => {
    if (!val || !val.trim()) return true;
    return val.toLowerCase() === 'true';
  })
});

export interface CSVParseResult {
  success: boolean;
  data: CSVProduct[];
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  totalRows: number;
  validRows: number;
}

export class CSVParser {
  
  static async parseProductCSV(filePath: string): Promise<CSVParseResult> {
    return new Promise((resolve) => {
      const results: CSVProduct[] = [];
      const errors: Array<{ row: number; error: string; data?: any }> = [];
      let totalRows = 0;
      let validRows = 0;

      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          totalRows++;
          
          try {
            const validatedData = productSchema.parse(data);
            
            // Build the product object
            const product: CSVProduct = {
              name: validatedData.name,
              description: validatedData.description,
              price: validatedData.price,
              category: validatedData.category,
              subcategory: validatedData.subcategory,
              stock: validatedData.stock,
              sku: validatedData.sku.toUpperCase(),
              tags: validatedData.tags
            };

            results.push(product);
            validRows++;
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
            errors.push({
              row: totalRows,
              error: errorMessage,
              data: data
            });
            
            logger.warn(`CSV parsing error at row ${totalRows}: ${errorMessage}`);
          }
        })
        .on('end', () => {
          const result: CSVParseResult = {
            success: errors.length === 0,
            data: results,
            errors,
            totalRows,
            validRows
          };

          logger.info(`CSV parsing completed: ${validRows}/${totalRows} rows processed successfully`);
          resolve(result);
        })
        .on('error', (error) => {
          logger.error('CSV parsing stream error:', error);
          resolve({
            success: false,
            data: [],
            errors: [{ row: 0, error: error.message }],
            totalRows: 0,
            validRows: 0
          });
        });
    });
  }

  static validateCSVHeaders(filePath: string): Promise<{ valid: boolean; missing: string[]; extra: string[] }> {
    return new Promise((resolve) => {
      const requiredHeaders = ['name', 'description', 'price', 'category', 'subcategory', 'stock', 'sku'];
      const optionalHeaders = ['tags', 'active'];
      const allValidHeaders = [...requiredHeaders, ...optionalHeaders];
      
      let headers: string[] = [];

      createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList: string[]) => {
          headers = headerList.map(h => h.toLowerCase().trim());
        })
        .on('data', () => {
          // We only need the headers, so we can resolve after the first data event
          const missing = requiredHeaders.filter(header => !headers.includes(header));
          const extra = headers.filter(header => !allValidHeaders.includes(header));
          
          resolve({
            valid: missing.length === 0,
            missing,
            extra
          });
        })
        .on('error', (error) => {
          logger.error('CSV header validation error:', error);
          resolve({
            valid: false,
            missing: requiredHeaders,
            extra: []
          });
        });
    });
  }

  static generateSampleCSV(): string {
    const headers = ['name', 'description', 'price', 'category', 'subcategory', 'stock', 'sku', 'tags', 'active'];
    const sampleData = [
      'Sample Product 1',
      'This is a sample product description',
      '29.99',
      'Electronics',
      'Audio Devices',
      '100',
      'SAMPLE001',
      'electronics;gadget;sample',
      'true'
    ];

    return [
      headers.join(','),
      sampleData.join(','),
      // Add one more sample row
      [
        'Sample Product 2',
        'Another sample product with different specifications',
        '49.99',
        'Paint & Decoration',
        'Interior Paint',
        '50',
        'SAMPLE002',
        'paint;interior;premium',
        'true'
      ].join(',')
    ].join('\n');
  }
}

// Export the parseCsvData function that VendorController expects
export async function parseCsvData(csvData: string, vendorId: string) {
  const Product = (await import('../models/Product.js')).default;
  
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const errors: Array<{ row: number; errors: string[] }> = [];
    let totalRows = 0;
    let successCount = 0;
    let errorCount = 0;

    // Parse CSV data from string
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      reject(new Error('CSV file must contain at least a header and one data row'));
      return;
    }

    // Better CSV parsing that handles quoted values
    const parseCSVLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i-1] === ',')) {
          inQuotes = true;
        } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
          inQuotes = false;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else if (char !== '"' || inQuotes) {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    
    // Process each data row
    Promise.all(lines.slice(1).map(async (line, index) => {
      totalRows++;
      const rowNumber = index + 2; // +2 because we skip header and array is 0-indexed
      
      try {
        const values = parseCSVLine(line);
        const rowData: any = {};
        
        // Map values to headers
        headers.forEach((header, i) => {
          rowData[header] = values[i] || '';
        });

        // Validate and transform the row data
        const validatedData = productSchema.parse(rowData);
        
        // CSV products should have NO images - vendors will upload them separately via bulk image upload

        // Create the product
        const productData = {
          name: validatedData.name,
          description: validatedData.description,
          price: validatedData.price,
          category: validatedData.category,
          subcategory: validatedData.subcategory,
          stock: validatedData.stock,
          sku: validatedData.sku.toUpperCase(),
          images: [], // No images - vendors will add them via bulk upload
          tags: validatedData.tags,
          vendor: vendorId,
          active: validatedData.active
        };

        // Check for duplicate SKU
        const existingProduct = await Product.findOne({ sku: productData.sku });
        if (existingProduct) {
          throw new Error(`SKU '${productData.sku}' already exists`);
        }

        // Create the product
        const product = new Product(productData);
        await product.save();
        
        results.push(product);
        successCount++;
        
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        
        let errorMessages: string[] = [];
        
        if (error instanceof Error) {
          // Handle Zod validation errors
          if (error.message.includes('validation')) {
            try {
              const zodError = JSON.parse(error.message);
              errorMessages = zodError.map((e: any) => `${e.path}: ${e.message}`);
            } catch {
              errorMessages = [error.message];
            }
          } else {
            errorMessages = [error.message];
          }
        } else {
          errorMessages = ['Unknown validation error'];
        }
          
        errors.push({
          row: rowNumber,
          errors: errorMessages
        });
        errorCount++;
      }
    })).then(() => {
      resolve({
        success: errorCount === 0,
        successCount,
        errorCount,
        totalRows,
        errors: errors,
        products: results
      });
    }).catch(reject);
  });
}