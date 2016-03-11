#!/bin/bash

sizes=( 128x128 256x256 16x16 32x32 192x192 22x22 24x24 256x256 512x512 32x32 32x32 64x64 36x36 48x48 48x48 512x512 1024x1024 64x64 64x64 72x72 96x96 )
dirnames=( 128x128 128x128@2x 16x16 16x16@2x 192x192 22x22 24x24 256x256 256x256@2x 32 32x32 32x32@2x 36x36 48 48x48 512x512 512x512@2x 64 64x64 72x72 96x96 )

for i in "${!sizes[@]}"
do
  mkdir -p icons/hicolor/"${dirnames[$i]}"/apps
  convert icons/HydrogenIDE.png -resize "${sizes[$i]}" icons/hicolor/"${dirnames[$i]}"/apps/hydrogen-ide.png
done
