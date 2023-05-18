#!/bin/bash

version="$1"

if [ -z "$version" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

sed -i "s/\"version\": \".*\"/\"version\": \"$version\"/" info.json
zip -r bob-openai-explainer.bobplugin info.json main.js icon.png

min_bob_version=$(sed -nr "s/^.*minBobVersion\": \"(.*?)\",$/\1/p" info.json)

sha256=$(shasum -a 256 bob-openai-explainer.bobplugin)

sed -i '3a\
        {\
          "version": "'$version'",\
          "desc": "'$version'",\
          "sha256": "'$sha256'",\
          "url": "https://github.com/Mopip77/bob-openai-explainer/releases/download/'$version'/bob-openai-explainer.bobplugin"\,
          "minBobVersion": "'$min_bob_version'"\
        },' appcast.json

