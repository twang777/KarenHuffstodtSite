const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting navigation menu extraction...\n');

// Step 1: Extract database archive if needed
const sqlPath = path.join(__dirname, 'wp_dump.sql');

if (!fs.existsSync(sqlPath)) {
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
}

// Step 2: Read SQL dump
console.log('Reading SQL dump...');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');
console.log('✓ SQL dump loaded\n');

// Step 3: Parse pages to create simple navigation
console.log('Creating navigation from published pages...\n');

// Find the INSERT INTO wp_posts section
const postsStart = sqlContent.indexOf('INSERT INTO `wp_posts` VALUES');
const postsEnd = sqlContent.indexOf('/*!40000 ALTER TABLE `wp_posts` ENABLE KEYS */', postsStart);

if (postsStart === -1 || postsEnd === -1) {
  console.error('Error: Could not find wp_posts data section');
  process.exit(1);
}

// Extract the VALUES section
const postsSection = sqlContent.substring(postsStart + 'INSERT INTO `wp_posts` VALUES'.length, postsEnd);
const rows = postsSection.split(/\),\n\(/);

const pages = [];

for (let i = 0; i < rows.length; i++) {
  let row = rows[i];
  row = row.trim().replace(/^\(/, '').replace(/\);?\s*$/, '');

  // Parse the row
  const values = [];
  let current = '';
  let inQuote = false;
  let escapeNext = false;

  for (let j = 0; j < row.length; j++) {
    const char = row[j];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === "'" && !escapeNext) {
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

  if (current) {
    values.push(current.trim());
  }

  if (values.length < 23) {
    continue;
  }

  const cleanValue = (str) => {
    if (!str) return '';
    str = str.replace(/^'|'$/g, '');
    str = str.replace(/\\'/g, "'");
    str = str.replace(/\\n/g, '\n');
    str = str.replace(/\\r/g, '\r');
    str = str.replace(/\\\\/g, '\\');
    return str;
  };

  const post = {
    ID: cleanValue(values[0]),
    post_title: cleanValue(values[5]),
    post_status: cleanValue(values[7]),
    post_name: cleanValue(values[11]),
    menu_order: parseInt(cleanValue(values[19])) || 0,
    post_type: cleanValue(values[20])
  };

  if (post.post_status === 'publish' && post.post_type === 'page') {
    pages.push(post);
  }
}

// Build navigation based on pages
const navigation = pages
  .sort((a, b) => a.menu_order - b.menu_order)
  .map(page => ({
    title: page.post_title,
    url: page.ID === '14' || page.post_title === 'Artist Teacher' ? '/' : `/${page.post_name}/`
  }))
  .filter(item => {
    // Exclude the Blog page and Privacy Policy from main navigation
    return item.title !== 'Blog' && item.title !== 'Privacy Policy';
  });

console.log('Navigation menu created:');
navigation.forEach((item, index) => {
  console.log(`  ${index + 1}. ${item.title}: ${item.url}`);
});

// Save to JSON file
const dataDir = path.join(__dirname, '../src/_data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const navPath = path.join(dataDir, 'navigation.json');
fs.writeFileSync(navPath, JSON.stringify(navigation, null, 2), 'utf8');

console.log(`\n✓ Navigation saved to src/_data/navigation.json`);
console.log(`✓ Created ${navigation.length} navigation items\n`);

// Cleanup
try {
  if (fs.existsSync(sqlPath)) {
    fs.unlinkSync(sqlPath);
    console.log('✓ Cleaned up temporary SQL dump\n');
  }
} catch (error) {
  // Ignore cleanup errors
}

console.log('✓ Navigation extraction complete!');
