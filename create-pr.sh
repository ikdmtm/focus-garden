#!/bin/bash
# PR作成ヘルパースクリプト
# Usage: ./create-pr.sh "PR Title" "PR Body"

set -e

TITLE="$1"
BODY="$2"

if [ -z "$TITLE" ]; then
    echo "Error: PR title is required"
    echo "Usage: ./create-pr.sh \"PR Title\" \"PR Body\""
    exit 1
fi

# 現在のブランチ名を取得
BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "main" ]; then
    echo "Error: Cannot create PR from main branch"
    exit 1
fi

# リモートにプッシュ（既にプッシュ済みの場合はスキップ）
echo "Pushing branch to remote..."
git push -u origin "$BRANCH" 2>/dev/null || echo "Branch already pushed"

# GitHubのリポジトリ情報を取得
REPO_URL=$(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//')

# PR作成URLを生成
PR_URL="${REPO_URL}/compare/main...${BRANCH}?expand=1"

if [ -n "$TITLE" ]; then
    # URLエンコード（簡易版）
    ENCODED_TITLE=$(echo "$TITLE" | sed 's/ /%20/g')
    PR_URL="${PR_URL}&title=${ENCODED_TITLE}"
fi

if [ -n "$BODY" ]; then
    ENCODED_BODY=$(echo "$BODY" | sed 's/ /%20/g' | sed 's/\n/%0A/g')
    PR_URL="${PR_URL}&body=${ENCODED_BODY}"
fi

echo ""
echo "✅ Branch pushed successfully!"
echo ""
echo "📝 Create PR by visiting:"
echo "$PR_URL"
echo ""
echo "Or manually create PR at:"
echo "${REPO_URL}/pulls"
