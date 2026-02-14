const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

console.log('Starting WordPress content extraction...\n');

// Step 1: Extract database archive
console.log('Extracting database archive...');
const archivesPath = path.join(__dirname, '../../Wordpress Archives');
const dbArchive = path.join(archivesPath, 'database-1766317326.tar');

try {
  execSync(`tar -xf "${dbArchive}" -C "${__dirname}"`, { stdio: 'inherit' });
  console.log('✓ Database archive extracted\n');
} catch (error) {
  console.error('Error extracting database:', error.message);
  process.exit(1);
}

// Step 2: Read SQL dump
const sqlPath = path.join(__dirname, 'wp_dump.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('Error: wp_dump.sql not found');
  process.exit(1);
}

console.log('Reading SQL dump...');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');
console.log('✓ SQL dump loaded\n');

// Step 3: Parse wp_posts table - simpler approach
console.log('Parsing wp_posts table...\n');

// Find the INSERT INTO wp_posts section
const postsStart = sqlContent.indexOf('INSERT INTO `wp_posts` VALUES');
const postsEnd = sqlContent.indexOf('/*!40000 ALTER TABLE `wp_posts` ENABLE KEYS */', postsStart);

if (postsStart === -1 || postsEnd === -1) {
  console.error('Error: Could not find wp_posts data section');
  process.exit(1);
}

// Extract the VALUES section
const postsSection = sqlContent.substring(postsStart + 'INSERT INTO `wp_posts` VALUES'.length, postsEnd);

// Split by "),(" to separate rows - but we need to be careful with nested parentheses
// Use a simple regex to split on rows
const rows = postsSection.split(/\),\n\(/);

console.log(`Found ${rows.length} total rows in wp_posts`);

const pages = [];

for (let i = 0; i < rows.length; i++) {
  let row = rows[i];

  // Clean up row (remove leading/trailing parentheses and whitespace)
  row = row.trim().replace(/^\(/, '').replace(/\);?\s*$/, '');

  // Parse the row - split by commas but respect quoted strings
  // This is a simplified parser that handles the WordPress SQL format
  const values = [];
  let current = '';
  let inQuote = false;

  for (let j = 0; j < row.length; j++) {
    const char = row[j];
    const nextChar = j < row.length - 1 ? row[j + 1] : null;

    // Handle escape sequences - keep both backslash and next char
    if (char === '\\' && nextChar !== null) {
      current += char + nextChar;
      j++; // Skip the next character since we already processed it
      continue;
    }

    if (char === "'") {
      inQuote = !inQuote;
      current += char;
      continue;
    }

    if (char === ',' && !inQuote) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  // Add the last value
  if (current) {
    values.push(current.trim());
  }

  // WordPress wp_posts table structure:
  // 0: ID, 1: post_author, 2: post_date, 3: post_date_gmt, 4: post_content,
  // 5: post_title, 6: post_excerpt, 7: post_status, 8: comment_status,
  // 9: ping_status, 10: post_password, 11: post_name, 12: to_ping, 13: pinged,
  // 14: post_modified, 15: post_modified_gmt, 16: post_content_filtered,
  // 17: post_parent, 18: guid, 19: menu_order, 20: post_type, 21: post_mime_type, 22: comment_count

  if (values.length < 23) {
    continue; // Skip malformed rows
  }

  const cleanValue = (str) => {
    if (!str) return '';
    // Remove surrounding quotes
    str = str.replace(/^'|'$/g, '');
    // Unescape SQL escapes
    str = str.replace(/\\'/g, "'");
    str = str.replace(/\\n/g, '\n');
    str = str.replace(/\\r/g, '\r');
    str = str.replace(/\\\\/g, '\\');
    return str;
  };

  const post = {
    ID: cleanValue(values[0]),
    post_author: cleanValue(values[1]),
    post_date: cleanValue(values[2]),
    post_content: cleanValue(values[4]),
    post_title: cleanValue(values[5]),
    post_status: cleanValue(values[7]),
    post_name: cleanValue(values[11]),
    menu_order: cleanValue(values[19]),
    post_type: cleanValue(values[20])
  };

  // Only include published pages
  if (post.post_status === 'publish' && post.post_type === 'page') {
    pages.push(post);
    console.log(`  Found: "${post.post_title}" (ID: ${post.ID})`);
  }
}

console.log(`\n✓ Found ${pages.length} published pages\n`);

// Step 4: Clean Gutenberg blocks and generate markdown files
console.log('Generating markdown files...\n');

const pagesDir = path.join(__dirname, '../src/pages');
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

function cleanGutenbergBlocks(content) {
  // Remove Gutenberg block comments but keep the HTML
  let cleaned = content.replace(/<!--\s*wp:[^>]*-->/g, '');
  cleaned = cleaned.replace(/<!--\s*\/wp:[^>]*-->/g, '');

  // Update image URLs
  cleaned = cleaned.replace(
    /https?:\/\/karenhuffstodt\.com\/wp-content\/uploads\//g,
    '/media/'
  );

  // Convert .tif extensions to .jpg
  cleaned = cleaned.replace(/\.tif(['"\s>])/gi, '.jpg$1');

  // Clean up excessive newlines
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');

  return cleaned.trim();
}

const createdPages = [];

for (const post of pages) {
  const slug = post.post_name || post.post_title.toLowerCase().replace(/\s+/g, '-');
  const cleanContent = cleanGutenbergBlocks(post.post_content);

  // Determine if this is the homepage (Artist Teacher - ID 14)
  const isHomepage = post.ID === '14' || post.post_title === 'Artist Teacher';

  const frontmatter = {
    title: post.post_title,
    slug: isHomepage ? 'index' : slug,
    date: post.post_date.split(' ')[0],
    layout: 'layouts/page',
    permalink: isHomepage ? '/' : `/${slug}/`,
    menuOrder: parseInt(post.menu_order) || 0
  };

  const markdownContent = `---
${yaml.dump(frontmatter).trim()}
---

${cleanContent}`;

  const filename = isHomepage ? 'index.md' : `${slug}.md`;
  const filepath = path.join(pagesDir, filename);

  fs.writeFileSync(filepath, markdownContent, 'utf8');
  createdPages.push({
    title: post.post_title,
    filename,
    slug: isHomepage ? '' : slug,
    menuOrder: frontmatter.menuOrder
  });

  console.log(`  ✓ Created: ${filename}`);
}

console.log(`\n✓ Created ${createdPages.length} markdown files`);
console.log('\n✓ Content extraction complete!');

// Cleanup
try {
  fs.unlinkSync(sqlPath);
  console.log('✓ Cleaned up temporary SQL dump\n');
} catch (error) {
  // Ignore cleanup errors
}
