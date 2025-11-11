/**
 * Upload Maloney & Thompson logo to Cloudinary
 */

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase credentials are required');
}
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error('Cloudinary credentials are required');
}

// Initialize Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function uploadLogo() {
  try {
    console.log('Uploading Maloney & Thompson logo to Cloudinary...');

    const localPath = path.resolve(__dirname, '../public/maloney-thompson-logo.png');

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'advisors/logos',
      public_id: 'maloney-thompson-sports-management',
      overwrite: true,
      resource_type: 'image',
    });

    console.log('✓ Uploaded to Cloudinary:', result.secure_url);

    // Update both Maloney & Thompson entries in database
    const slugs = ['maloney-thompson-sports-mgt', 'maloney-thompson-sports-management'];

    for (const slug of slugs) {
      const { data, error } = await supabase
        .from('advisors')
        .update({ logo_url: result.secure_url })
        .eq('slug', slug)
        .select();

      if (error) {
        console.error(`Error updating ${slug}:`, error);
      } else if (data && data.length > 0) {
        console.log(`✓ Updated database for ${slug}`);
      } else {
        console.log(`⚠️  No record found for slug: ${slug}`);
      }
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

uploadLogo();
