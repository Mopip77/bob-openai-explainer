#!/bin/bash

version="$1"

if [ -z "$version" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

gsed -i "s/\"version\": \".*\"/\"version\": \"$version\"/" info.json

zip -r bob-openai-explainer.bobplugin info.json main.js icon.png
