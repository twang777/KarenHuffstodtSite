const pluginSitemap = require("@quasibit/eleventy-plugin-sitemap");

module.exports = function(eleventyConfig) {
  // Copy media files as-is (passthrough)
  eleventyConfig.addPassthroughCopy("src/media");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Add sitemap plugin
  eleventyConfig.addPlugin(pluginSitemap, {
    sitemap: {
      hostname: "https://karenhuffstodt.com",
    },
  });

  // Add collection for pages sorted by menu order
  eleventyConfig.addCollection("pages", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/pages/*.md")
      .sort((a, b) => (a.data.menuOrder || 0) - (b.data.menuOrder || 0));
  });

  // Configure markdown library to allow HTML
  const markdownIt = require("markdown-it");
  const markdownItAttrs = require("markdown-it-attrs");

  const markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAttrs);

  eleventyConfig.setLibrary("md", markdownLibrary);

  // Return configuration
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    passthroughFileCopy: true
  };
};
