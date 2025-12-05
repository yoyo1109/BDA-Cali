#!/bin/bash
# Script to push your code to your new GitHub repository
#
# BEFORE RUNNING:
# 1. Create a new repo on GitHub at https://github.com/new
# 2. Copy the repository URL (looks like: https://github.com/yoyo1109/BDA-Cali.git)
# 3. Replace YOUR_USERNAME and REPO_NAME below with your actual values
#
# THEN RUN:
# chmod +x PUSH_TO_NEW_REPO.sh
# ./PUSH_TO_NEW_REPO.sh

# YOUR SETTINGS (UPDATE THESE!)
YOUR_USERNAME="yoyo1109"
REPO_NAME="BDA-Cali"

# Constructed URL
NEW_REPO_URL="https://github.com/${YOUR_USERNAME}/${REPO_NAME}.git"

echo "🔧 Updating remote repository..."
echo "Old remote: $(git remote get-url origin)"
echo "New remote: ${NEW_REPO_URL}"
echo ""

# Update the remote URL
git remote set-url origin "${NEW_REPO_URL}"

echo "✅ Remote updated!"
echo ""
echo "🚀 Pushing your branch: Yaoyao-Peng..."
echo ""

# Push your branch
git push -u origin Yaoyao-Peng

echo ""
echo "🎉 Done! Your code is now on GitHub!"
echo ""
echo "📍 View it at: https://github.com/${YOUR_USERNAME}/${REPO_NAME}"
echo ""
echo "💡 Next steps:"
echo "   - Push main branch: git push -u origin main"
echo "   - View on GitHub: https://github.com/${YOUR_USERNAME}/${REPO_NAME}"
