const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const { glob } = require('glob');
const { execSync } = require('child_process');

async function processMedia() {
  console.log('Starting media processing...\n');

  // Step 1: Extract storage archive
  console.log('Extracting storage archive (this may take a few minutes - 1.2GB)...');
  const archivesPath = path.join(__dirname, '../../Wordpress Archives');
  const storageArchive = path.join(archivesPath, 'storage-1766317326.tar');
  const extractPath = path.join(__dirname, '../temp-storage');

  // Create temp directory for extraction
  fs.ensureDirSync(extractPath);

  try {
    execSync(`tar -xf "${storageArchive}" -C "${extractPath}"`, { stdio: 'inherit' });
    console.log('✓ Storage archive extracted\n');
  } catch (error) {
    console.error('Error extracting storage archive:', error.message);
    process.exit(1);
  }

  // Step 2: Copy uploads to src/media
  console.log('Copying media files to src/media...');
  const uploadsPath = path.join(extractPath, 'wp-content/uploads');
  const mediaPath = path.join(__dirname, '../src/media');

  if (!fs.existsSync(uploadsPath)) {
    console.error('Error: wp-content/uploads directory not found in archive');
    process.exit(1);
  }

  fs.copySync(uploadsPath, mediaPath);
  console.log('✓ Media files copied\n');

  // Step 3: Convert TIFF files to JPG
  console.log('Converting TIFF files to JPG...');
  const tiffFiles = glob.sync(path.join(mediaPath, '**/*.{tif,TIF,tiff,TIFF}'));

  if (tiffFiles.length === 0) {
    console.log('No TIFF files found to convert');
  } else {
    console.log(`Found ${tiffFiles.length} TIFF files to convert`);
    let converted = 0;

    for (const tiffPath of tiffFiles) {
      try {
        const jpgPath = tiffPath.replace(/\.(tif|TIF|tiff|TIFF)$/i, '.jpg');

        await sharp(tiffPath)
          .jpeg({ quality: 85, progressive: true })
          .toFile(jpgPath);

        // Remove original TIFF
        fs.unlinkSync(tiffPath);
        converted++;

        if (converted % 5 === 0) {
          process.stdout.write(`  Converted ${converted}/${tiffFiles.length}...\r`);
        }
      } catch (error) {
        console.error(`\n  Error converting ${path.basename(tiffPath)}:`, error.message);
      }
    }

    console.log(`\n✓ Converted ${converted} TIFF files to JPG\n`);
  }

  // Step 4: Optimize JPG files
  console.log('Optimizing JPG files...');
  const jpgFiles = glob.sync(path.join(mediaPath, '**/*.{jpg,jpeg,JPG,JPEG}'));
  console.log(`Found ${jpgFiles.length} JPG files to optimize`);

  let optimized = 0;

    for (const jpgPath of jpgFiles) {
    try {
      const tempPath = jpgPath + '.tmp';

      await sharp(jpgPath)
        .jpeg({ quality: 85, progressive: true })
        .toFile(tempPath);

      // Check if optimized version is smaller
      const originalSize = fs.statSync(jpgPath).size;
      const newSize = fs.statSync(tempPath).size;

      if (newSize < originalSize) {
        fs.renameSync(tempPath, jpgPath);
        optimized++;
      } else {
        fs.unlinkSync(tempPath);
      }

      if (optimized % 10 === 0) {
        process.stdout.write(`  Optimized ${optimized}/${jpgFiles.length}...\r`);
      }
    } catch (error) {
      // Skip files that can't be optimized
      const tempPath = jpgPath + '.tmp';
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  console.log(`\n✓ Optimized ${optimized} JPG files\n`);

  // Step 5: Get file statistics
  const allMediaFiles = glob.sync(path.join(mediaPath, '**/*.*'));
  let totalSize = 0;

  for (const file of allMediaFiles) {
    const stats = fs.statSync(file);
    if (stats.isFile()) {
      totalSize += stats.size;
    }
  }

  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

  console.log('Media processing statistics:');
  console.log(`  Total files: ${allMediaFiles.length}`);
  console.log(`  Total size: ${totalSizeMB} MB`);
  console.log(`  TIFF files converted: ${tiffFiles.length}`);
  console.log(`  JPG files optimized: ${optimized}`);

  // Step 6: Cleanup temp directory
  console.log('\nCleaning up temporary files...');
  fs.removeSync(extractPath);
  console.log('✓ Cleanup complete\n');

  console.log('✓ Media processing complete!');
}

// Run the async function
processMedia().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
