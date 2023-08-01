#!/bin/sh

if [ -z "$1" ]; then
    echo "Please provide an argument: major, minor or patch"
    exit 1
fi

npm version $1 --no-git-tag-version
