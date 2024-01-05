import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import axios from "axios";
import { IgApiClient } from "instagram-private-api";
import { StickerBuilder } from 'instagram-private-api/dist/sticker-builder';

dotenv.config();

if (!process.env.SUPABASE_URL && !process.env.SUPABASE_KEY) {
    throw new Error('Please provide your Supabase URL and API key on the .env file.');
}
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getAllTables() {
    try {
        // Fetching all tables using Supabase client
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('*');
            // .eq('table_schema', 'public'); // Adjust if your tables are in a different schema
    
        if (error) {
            console.error('Error fetching dsfs tables:', error);
            return;
        }
    
        // Displaying table names
        const tableNames = data.map(table => table.table_name);
        console.log('Table Names:', tableNames);
    } catch (error) {
        console.error('Error fetching tables:', error);
    }
}
  


export async function postToInsta(imageUrl: string, caption: string) {
  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.IG_USERNAME!);
  await ig.account.login(process.env.IG_USERNAME!, process.env.IG_PASSWORD!);

  const { data: imageBuffer } = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  const res = await ig.publish.photo({
    file: Buffer.from(imageBuffer, "binary"),
    caption,
  });
  if (res.status!== "ok") {
    console.log("Something went wrong while publishing the photo", res);
    return { success: false, data: "Something went wrong while publishing the photo" };
  } 
//   console.log('res', res);
  return { success: true, data: JSON.stringify(res) };
}

export async function getInstaLogin(username: string, password: string) {
  const ig = new IgApiClient();

  ig.state.generateDevice(username);
  await ig.account.login(username, password);

  const userData = {
    username: ig.account.currentUser(),
  };
  console.log(JSON.stringify(userData));

  return { success: true, data: JSON.stringify(userData) };
}



export async function postStoryToInsta(imageUrl: string) {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME!);
    await ig.account.login(process.env.IG_USERNAME!, process.env.IG_PASSWORD!);
  
    const { data: imageBuffer } = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const file = Buffer.from(imageBuffer, "binary");

  const res = await ig.publish.story({
    file,
  });
  if (res.status!== "ok") {
    return { success: false, data: JSON.stringify(res) };
  } 
  return { success: true, data: JSON.stringify(res) };
}
export async function postVideoToInsta(video: any, caption?: string) {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME!);
    await ig.account.login(process.env.IG_USERNAME!, process.env.IG_PASSWORD!);

    const { data: imageBuffer } = await axios.get(video, {
        responseType: "arraybuffer",
      });
      const file = Buffer.from(imageBuffer, "binary");
      const res = await ig.publish.video({
          video: (file),
          coverImage: (file),
      })

      if (res.status!== "ok") {
        return { success: false, data: JSON.stringify(res) };
      } 
      return { success: true, data: JSON.stringify(res) };
    }
