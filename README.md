# HydrogenIDE
An IDE for Electron.

Currently under heavy development. Right now I'm trying to make it support all the basic features of an editor, before diving into the IDE aspect. When it's usuable, it'll support a view and menu construction UI, tray icons, packaging and installer creation, and more.

Currently it supports:
 * Code editing
 * Project creation and loading
 * Project templates
 * Styntax highlighting
 * Project execution
 * Dependency management (to an extent)

And more in the future.

## Install
```bash
git clone https://github.com/facekapow/HydrogenIDE.git
cd HydrogenIDE
npm install
# optional: generate icons:
./genicn.sh # requires ImageMagick
```

## Usage
```bash
# in the `HydrogenIDE` folder...
npm start
```
## Notes
The "Run", "Install", and "Update" tools aren't currently working in the packaged release version.
