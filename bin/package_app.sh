#!/usr/bin/env bash
set -e

npm install -g electron-packager
brew update
brew upgrade
brew install Caskroom/cask/xquartz
brew install wine
brew install mono
brew install gnu-tar graphicsmagick xz
brew install rpm
npm run dist:all