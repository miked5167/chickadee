/**
 * Replace Popoff Sports Management logo with generic placeholder
 */

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generatePlaceholderBuffer } from '../lib/generate-placeholder';

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

async function replaceLogo() {
  try {
    console.log('Generating placeholder logo for Popoff Sports Management...');

    // Generate placeholder
    const placeholderBuffer = await generatePlaceholderBuffer('Popoff Sports Management');

    console.log('Uploading placeholder to Cloudinary...');

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'advisors/logos',
          public_id: 'popoff-sports-management',
          overwrite: true,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(placeholderBuffer);
    });

    console.log('✓ Uploaded placeholder to Cloudinary:', result.secure_url);

    // Update database
    const { data, error } = await supabase
      .from('advisors')
      .update({ logo_url: result.secure_url })
      .eq('slug', 'popoff-sports-management')
      .select();

    if (error) {
      throw error;
    }

    console.log('✓ Updated database for Popoff Sports Management');
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

replaceLogo();
