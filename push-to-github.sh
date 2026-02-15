#!/bin/bash

# Script to push to GitHub
# Run this with: bash push-to-github.sh

cd "/Users/tylerwang/Code/VibeCode/Karens site/karenhuffstodt-static"

echo "Checking git status..."
git status

echo ""
echo "Pushing to GitHub..."
git push -u origin master

echo ""
echo "Done! Check the output above for any errors."
echo "Your code should now be at: https://github.com/twang777/KarenHuffstodtSite"
