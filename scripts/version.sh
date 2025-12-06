#!/bin/bash

VERSION=$1

function help() {
    echo "Usage: $0 <version>"
    echo ""
    echo "  Version must be in the format x.x.x"
    echo "  Example: $0 0.0.2"
    exit 1
}

if [ -z "$VERSION" ]; then
    help
elif ! echo "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    help
fi

git tag -a v$VERSION -m "Release $VERSION"
git push origin v$VERSION