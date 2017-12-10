#!/usr/bin/env bash
set -e

brew update
brew upgrade
brew install node
brew install Caskroom/cask/xquartz
brew install wine
brew install mono
brew install gnu-tar graphicsmagick xz
brew install rpm

npm install -g electron-packager
npm install
npm run dist:all