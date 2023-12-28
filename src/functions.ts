import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_URL && !process.env.SUPABASE_KEY) {
    throw new Error('Please provide your Supabase URL and API key on the .env file.');
}
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseServiceKey);



export async function getTablesAndColumns(keywords?: string[]) {
    const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name');

    if (tablesError) {
        console.error('Error fetching table names:', tablesError.message);
        return null;
    }

    const tableNames = tables?.map(table => table.table_name);
    console.log('tables', tableNames);
    
    if (!tableNames || tableNames.length === 0) {
        console.log('No tables found.');
        return null;
    }

    const columnsPromises = tableNames.map(async tableName => {
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', tableName)
            .eq('table_schema', 'public');

        if (columnsError) {
            console.error(`Error fetching columns for table ${tableName}:`, columnsError.message);
            return null;
        }

        const columnNames = columns?.map(column => column.column_name);
        console.log('columns', columnNames);
        
        return { tableName, columnNames };
    });

    const columns = await Promise.all(columnsPromises);

    return columns.filter(Boolean); // Remove null values
}
